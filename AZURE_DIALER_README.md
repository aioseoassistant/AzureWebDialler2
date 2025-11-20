# Azure Communication Services Web Dialer

A web-based voice dialer application built with Azure Communication Services that enables making and receiving voice calls with DTMF support directly from your browser.

## Features

- **Voice Calling**: Make and receive phone calls through your web browser
- **DTMF Support**: Send dual-tone multi-frequency tones during active calls
- **Real-time Call Status**: Visual indicators for call states (connecting, connected, disconnected)
- **Call Timer**: Track call duration in real-time
- **Intuitive Dialpad**: Full numeric keypad with keyboard support
- **Microphone Access**: Automatic device permission handling
- **Professional UI**: Modern, responsive design with gradient styling

## Architecture

### Backend (Python/Flask)
- **app.py**: Flask application with Azure Communication Services routes
- **config.py**: Configuration management for Azure credentials
- **Routes**:
  - `/dialer` - Web dialer interface
  - `/api/token` - Generate user access tokens
  - `/api/call/outbound` - Initiate outbound calls
  - `/api/call/events` - Webhook for call events
  - `/api/phone/info` - Get phone number information

### Frontend (JavaScript)
- **dialer.html**: Web dialer UI with dialpad and call controls
- **dialer.js**: Azure Communication Services Calling SDK integration
  - Call management (make, receive, hangup)
  - DTMF tone transmission
  - Real-time call state handling
  - Microphone device management

## Prerequisites

1. **Azure Account**: Active Azure subscription
2. **Azure Communication Services Resource**: Created in Azure Portal
3. **Phone Number**: Acquired phone number with voice calling capabilities
4. **Python 3.11+**: For running the Flask application
5. **Modern Browser**: Chrome, Edge, or Firefox with WebRTC support

## Setup Instructions

### 1. Create Azure Communication Services Resource

1. Go to [Azure Portal](https://portal.azure.com)
2. Click "Create a resource" → Search for "Communication Services"
3. Fill in the required details:
   - **Subscription**: Select your subscription
   - **Resource group**: Create new or use existing
   - **Resource name**: Choose a unique name
   - **Region**: Select your preferred region
4. Click "Review + create" → "Create"
5. Once deployed, go to the resource
6. Navigate to "Keys" and copy the **Connection string**

### 2. Acquire a Phone Number

1. In your Communication Services resource, click "Phone numbers" in the left menu
2. Click "Get" button
3. Configure phone number settings:
   - **Country**: Select your country
   - **Number type**: Choose "Geographic" or "Toll-free"
   - **Capabilities**: Enable **"Make calls"** and **"Receive calls"**
4. Search for available numbers and purchase one
5. Note the acquired phone number (format: +1234567890)

### 3. Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your Azure credentials:
   ```env
   AZURE_COMMUNICATION_CONNECTION_STRING=endpoint=https://<your-resource>.communication.azure.com/;accesskey=<your-access-key>
   AZURE_PHONE_NUMBER=+1234567890
   CALLBACK_BASE_URL=http://localhost:5000
   ```

3. For production, set `CALLBACK_BASE_URL` to your public URL (for webhooks)

### 4. Install Dependencies

```bash
pip install -r requirements.txt
```

The following packages will be installed:
- `azure-communication-identity` - User identity management
- `azure-communication-phonenumbers` - Phone number operations
- `azure-communication-callautomation` - Call automation features
- `python-dotenv` - Environment variable loading
- `Flask` - Web framework

### 5. Run the Application

```bash
python app.py
```

The application will start on `http://localhost:5000`

### 6. Access the Dialer

Open your browser and navigate to:
```
http://localhost:5000/dialer
```

## Usage Guide

### Making a Call

1. Enter the phone number using the dialpad (or keyboard)
2. Click the "Call" button (or press Enter)
3. Wait for the call to connect
4. Use the call controls during the active call

### Sending DTMF Tones

During an active call, you can send DTMF tones in two ways:
1. Click the DTMF buttons in the "Send DTMF Tones" section
2. Press keys (0-9, *, #) on your keyboard

DTMF tones are commonly used for:
- Interactive Voice Response (IVR) systems
- Entering PIN codes
- Navigating phone menus
- Conference call controls

### Keyboard Shortcuts

- **0-9, *, #**: Dial number or send DTMF (during call)
- **Enter**: Make call
- **Escape**: Hang up call
- **Backspace**: Delete last digit

### Ending a Call

Click the "Hangup" button or press Escape

## Call Flow

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ 1. Request token
       ▼
┌─────────────────┐
│  Flask Backend  │
│  /api/token     │
└──────┬──────────┘
       │ 2. Generate token
       ▼
┌──────────────────────────┐
│ Azure Communication      │
│ Services Identity API    │
└──────┬───────────────────┘
       │ 3. Return token
       ▼
┌─────────────┐
│   Browser   │
│ CallClient  │
└──────┬──────┘
       │ 4. Initialize CallAgent
       │ 5. Start call
       ▼
┌──────────────────────────┐
│ Azure Communication      │
│ Services Calling API     │
└──────┬───────────────────┘
       │ 6. Establish call
       ▼
┌─────────────┐
│   PSTN      │
│ (Phone)     │
└─────────────┘
```

## API Endpoints

### GET /api/token
Generate a user access token for Azure Communication Services

**Response:**
```json
{
  "token": "eyJ...",
  "expiresOn": "2024-01-01T00:00:00Z",
  "userId": "8:acs:..."
}
```

### POST /api/call/outbound
Initiate an outbound call (server-side)

**Request:**
```json
{
  "targetPhone": "+1234567890"
}
```

### POST /api/call/events
Webhook endpoint for Azure call events

**Event Types:**
- `Microsoft.Communication.IncomingCall`
- `Microsoft.Communication.CallConnected`
- `Microsoft.Communication.CallDisconnected`

### GET /api/phone/info
Get configured phone number information

**Response:**
```json
{
  "phoneNumber": "+1234567890",
  "capabilities": ["voice", "dtmf"]
}
```

## DTMF Implementation

The DTMF (Dual-Tone Multi-Frequency) feature is implemented using the Azure Communication Services Calling SDK's `sendDtmf()` method.

**JavaScript Implementation:**
```javascript
async function sendDTMF(tone) {
    if (call && call.state === 'Connected') {
        await call.sendDtmf(tone);
        console.log('DTMF tone sent:', tone);
    }
}
```

**Supported Tones:** 0-9, *, #

## Troubleshooting

### "Failed to initialize" Error
- Verify Azure connection string is correct
- Check that phone number is properly formatted (+1234567890)
- Ensure `.env` file exists and is loaded

### "Failed to get access token" Error
- Verify Azure Communication Services resource is active
- Check connection string has correct endpoint and access key
- Ensure no firewall is blocking Azure API calls

### No Microphone Access
- Grant microphone permissions in browser
- Check browser console for permission errors
- Verify microphone is not being used by another application

### Call Not Connecting
- Verify phone number format includes country code (+)
- Check that acquired Azure phone number has calling capabilities
- Ensure sufficient Azure credits/billing is configured
- Check browser console for WebRTC errors

### DTMF Not Working
- Ensure call is in "Connected" state before sending tones
- Verify the receiving system supports DTMF
- Check browser console for DTMF errors

## Browser Compatibility

The web dialer uses WebRTC and requires a modern browser:

| Browser | Minimum Version | Status |
|---------|----------------|--------|
| Chrome  | 90+            | ✅ Supported |
| Edge    | 90+            | ✅ Supported |
| Firefox | 88+            | ✅ Supported |
| Safari  | 14+            | ⚠️ Limited |

## Security Considerations

1. **Never commit `.env` file** - Contains sensitive credentials
2. **Use HTTPS in production** - Required for microphone access
3. **Implement authentication** - Add user authentication before allowing calls
4. **Rate limiting** - Prevent abuse of calling endpoints
5. **Token expiration** - Tokens expire after 24 hours by default
6. **Webhook validation** - Validate Azure webhook signatures in production

## Cost Considerations

Azure Communication Services charges for:
- **Phone number rental**: Monthly fee per number
- **Outbound calls**: Per-minute rates vary by destination
- **Inbound calls**: Per-minute rates
- **PSTN connectivity**: Connection fees

Check [Azure Communication Services pricing](https://azure.microsoft.com/en-us/pricing/details/communication-services/) for details.

## Production Deployment

### Required Changes

1. **Enable HTTPS**:
   - Use a reverse proxy (nginx, Apache)
   - Obtain SSL certificate (Let's Encrypt)

2. **Set Production URL**:
   ```env
   CALLBACK_BASE_URL=https://your-domain.com
   ```

3. **Configure Webhooks**:
   - In Azure Portal, set Event Grid webhook to `https://your-domain.com/api/call/events`

4. **Add Authentication**:
   - Implement user login
   - Restrict dialer access to authorized users

5. **Disable Debug Mode**:
   ```env
   DEBUG=false
   ```

6. **Use Production WSGI Server**:
   ```bash
   pip install gunicorn
   gunicorn -w 4 -b 0.0.0.0:5000 app:app
   ```

## File Structure

```
Aiseo/
├── app.py                      # Flask application
├── config.py                   # Configuration management
├── requirements.txt            # Python dependencies
├── .env.example               # Environment variables template
├── .env                       # Your credentials (gitignored)
├── .gitignore                 # Git ignore rules
├── templates/
│   ├── dialer.html            # Web dialer interface
│   └── dialer_setup.html      # Setup instructions page
├── static/
│   └── dialer.js              # Calling SDK integration
└── AZURE_DIALER_README.md     # This file
```

## Additional Resources

- [Azure Communication Services Documentation](https://learn.microsoft.com/en-us/azure/communication-services/)
- [Calling SDK Reference](https://learn.microsoft.com/en-us/javascript/api/overview/azure/communication-calling)
- [DTMF in Azure Communication Services](https://learn.microsoft.com/en-us/azure/communication-services/how-tos/calling-sdk/dtmf)
- [Phone Number Management](https://learn.microsoft.com/en-us/azure/communication-services/quickstarts/telephony/get-phone-number)

## Support

For issues and questions:
- Azure Communication Services: [Azure Support](https://azure.microsoft.com/en-us/support/)
- Application Issues: Check browser console logs and Flask server logs

## License

This project is part of the Aiseo application. Refer to the main project license.

---

**Built with Azure Communication Services** | **Flask** | **JavaScript WebRTC**
