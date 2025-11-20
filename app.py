
from flask import Flask, render_template, request, jsonify
import asyncio
from seo_analyzer import SEOAnalyzer
from config import Config
from azure.communication.identity import CommunicationIdentityClient
from azure.communication.callautomation import CallAutomationClient
from azure.communication.phonenumbers import PhoneNumbersClient
from azure.core.credentials import AzureKeyCredential
import logging

app = Flask(__name__)
app.config.from_object(Config)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze():
    url = request.form['url']
    depth = int(request.form.get('depth', 2))

    analyzer = SEOAnalyzer(url, max_depth=depth)
    results = asyncio.run(analyzer.crawl())

    return render_template('results.html', results=results, base_url=url)


# ===== Azure Communication Services Routes =====

@app.route('/dialer')
def dialer():
    """Render the web dialer interface"""
    # Validate Azure configuration
    is_valid, errors = Config.validate()
    if not is_valid:
        return render_template('dialer_setup.html', errors=errors)

    return render_template('dialer.html', phone_number=Config.AZURE_PHONE_NUMBER)


@app.route('/api/token', methods=['GET'])
def get_user_token():
    """Generate a user access token for Azure Communication Services"""
    try:
        # Validate configuration
        is_valid, errors = Config.validate()
        if not is_valid:
            return jsonify({'error': 'Azure configuration not set', 'details': errors}), 500

        # Create identity client
        identity_client = CommunicationIdentityClient.from_connection_string(
            Config.AZURE_COMMUNICATION_CONNECTION_STRING
        )

        # Create a new user and issue a token with VoIP scope
        user = identity_client.create_user()
        token_result = identity_client.get_token(user, scopes=["voip"])

        logger.info(f"Generated token for user: {user.properties['id']}")

        return jsonify({
            'token': token_result.token,
            'expiresOn': token_result.expires_on.isoformat(),
            'userId': user.properties['id']
        })

    except Exception as e:
        logger.error(f"Error generating token: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/call/outbound', methods=['POST'])
def initiate_outbound_call():
    """Initiate an outbound call using Azure Communication Services"""
    try:
        data = request.get_json()
        target_phone = data.get('targetPhone')

        if not target_phone:
            return jsonify({'error': 'Target phone number is required'}), 400

        # Validate configuration
        is_valid, errors = Config.validate()
        if not is_valid:
            return jsonify({'error': 'Azure configuration not set', 'details': errors}), 500

        # Create call automation client
        call_automation_client = CallAutomationClient.from_connection_string(
            Config.AZURE_COMMUNICATION_CONNECTION_STRING
        )

        # Note: This is a server-side call initiation example
        # For client-side calling (which is more common for web dialers),
        # the call is initiated from the browser using the Calling SDK
        # This endpoint can be used for server-initiated calls if needed

        logger.info(f"Outbound call request from {Config.AZURE_PHONE_NUMBER} to {target_phone}")

        return jsonify({
            'message': 'Call initiation endpoint ready',
            'note': 'For web dialer, calls are initiated client-side using the Calling SDK'
        })

    except Exception as e:
        logger.error(f"Error initiating call: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/call/events', methods=['POST'])
def handle_call_events():
    """Webhook endpoint to handle incoming call events from Azure"""
    try:
        event_data = request.get_json()
        event_type = event_data.get('type') if event_data else None

        logger.info(f"Received call event: {event_type}")
        logger.debug(f"Event data: {event_data}")

        # Process different event types
        if event_type == 'Microsoft.Communication.IncomingCall':
            # Handle incoming call
            logger.info("Incoming call received")
            # Add your custom logic here

        elif event_type == 'Microsoft.Communication.CallConnected':
            logger.info("Call connected")

        elif event_type == 'Microsoft.Communication.CallDisconnected':
            logger.info("Call disconnected")

        # Return 200 OK to acknowledge receipt
        return jsonify({'status': 'received'}), 200

    except Exception as e:
        logger.error(f"Error handling call event: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/phone/info', methods=['GET'])
def get_phone_info():
    """Get information about the configured phone number"""
    try:
        # Validate configuration
        is_valid, errors = Config.validate()
        if not is_valid:
            return jsonify({'error': 'Azure configuration not set', 'details': errors}), 500

        return jsonify({
            'phoneNumber': Config.AZURE_PHONE_NUMBER,
            'capabilities': ['voice', 'dtmf']
        })

    except Exception as e:
        logger.error(f"Error getting phone info: {str(e)}")
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)
