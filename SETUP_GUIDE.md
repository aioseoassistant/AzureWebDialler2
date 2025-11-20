# 🚀 Azure Communication Services Web Dialer - Complete Setup Guide

This guide will walk you through the complete setup process for your Azure Communication Services web dialer application with DTMF support.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Azure Portal Setup](#azure-portal-setup)
3. [Local Environment Setup](#local-environment-setup)
4. [Running the Application](#running-the-application)
5. [Using the Web Dialer](#using-the-web-dialer)
6. [Troubleshooting](#troubleshooting)
7. [Production Deployment](#production-deployment)

---

## ✅ Prerequisites

Before starting, ensure you have:

- **Azure Account**: [Create one here](https://azure.microsoft.com/free/) if you don't have one
- **Python 3.8+**: Check with `python --version` or `python3 --version`
- **pip**: Python package manager (comes with Python)
- **Modern Web Browser**: Chrome, Edge, or Firefox (for WebRTC support)
- **Credit Card**: Required for Azure (free tier available, but card needed for verification)

---

## 🔷 Azure Portal Setup

### Step 1: Create Azure Communication Services Resource

1. **Login to Azure Portal**
   - Go to [https://portal.azure.com](https://portal.azure.com)
   - Sign in with your Azure account

2. **Create Resource**
   - Click **"Create a resource"** (top left)
   - Search for **"Communication Services"**
   - Click on **"Communication Services"** from the results
   - Click **"Create"**

3. **Configure Resource**
   ```
   Subscription: [Select your subscription]
   Resource group: [Create new or select existing]
   Resource name: my-dialer-acs (or any unique name)
   Data location: United States (or your preferred region)
   ```

4. **Create and Deploy**
   - Click **"Review + create"**
   - Click **"Create"**
   - Wait for deployment (usually takes 1-2 minutes)
   - Click **"Go to resource"** when deployment is complete

### Step 2: Get Connection String

1. In your Communication Services resource, find **"Keys"** in the left menu
2. Under **"Primary key"** section, you'll see **"Connection string"**
3. Click the **copy icon** next to the connection string
4. Save this - you'll need it in Step 4

   **Example format:**
   ```
   endpoint=https://my-dialer-acs.communication.azure.com/;accesskey=ABC123...
   ```

### Step 3: Purchase Phone Number

1. In your Communication Services resource, click **"Phone numbers"** (left menu)
2. Click **"Get"** button at the top
3. Configure phone number:
   ```
   Country/Region: United States (or your country)
   Number type: Geographic or Toll-free
   ```
4. Under **"Calling"** section, enable:
   - ✅ **Make calls** (required)
   - ✅ **Receive calls** (optional, for incoming calls)
5. Click **"Search"** to find available numbers
6. Select a number from the results
7. Click **"Next"**
8. Review the monthly cost
9. Click **"Place order"**
10. Wait for the number to be provisioned (can take a few minutes)
11. Once ready, copy the phone number (format: +12345678901)

**Cost Note:** Phone numbers typically cost $1-2 per month plus per-minute call charges.

---

## 💻 Local Environment Setup

### Step 4: Configure Environment Variables

1. **Open the .env file** in the project root directory
   ```bash
   nano .env   # or use your preferred text editor
   ```

2. **Update with your Azure credentials:**
   ```env
   # Paste your connection string from Step 2
   AZURE_COMMUNICATION_CONNECTION_STRING=endpoint=https://my-dialer-acs.communication.azure.com/;accesskey=ABC123...

   # Paste your phone number from Step 3
   AZURE_PHONE_NUMBER=+12345678901

   # Keep as-is for local development
   CALLBACK_BASE_URL=http://localhost:5000

   # Optional: Change for production
   SECRET_KEY=dev-secret-key-change-in-production
   DEBUG=True
   ```

3. **Save the file** (Ctrl+X, Y, Enter in nano)

### Step 5: Install Python Dependencies

1. **Create virtual environment** (recommended):
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

   This will install:
   - Flask (web framework)
   - Azure Communication Services SDKs
   - python-dotenv (environment variables)
   - Other dependencies

3. **Verify installation:**
   ```bash
   pip list | grep azure
   ```
   You should see azure-communication packages listed.

---

## 🎯 Running the Application

### Step 6: Start the Flask Server

1. **Make sure you're in the project directory:**
   ```bash
   cd /path/to/AzureWebDialler2
   ```

2. **Activate virtual environment** (if not already active):
   ```bash
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Run the application:**
   ```bash
   python app.py
   ```

4. **Expected output:**
   ```
   * Serving Flask app 'app'
   * Debug mode: on
   * Running on http://127.0.0.1:5000
   ```

5. **Keep this terminal open** - the server must run while using the app

### Step 7: Access the Web Dialer

1. **Open your web browser**
2. **Navigate to:**
   ```
   http://localhost:5000/dialer
   ```

3. **Grant microphone permissions** when prompted by the browser

4. **Wait for initialization** - You should see:
   - Status: "Ready to call" (green background)
   - Your phone number displayed at the top
   - Call button enabled

---

## 📞 Using the Web Dialer

### Making a Call

1. **Enter phone number:**
   - Click the dialpad buttons, OR
   - Type directly using your keyboard (0-9, *, #)
   - Number will automatically be formatted with + prefix

2. **Start the call:**
   - Click the **"Call"** button, OR
   - Press **Enter** key

3. **Wait for connection:**
   - Status will show "Calling..."
   - Then "Ringing..."
   - Finally "Call connected" when answered

### Sending DTMF Tones (During Active Call)

**What are DTMF tones?**
DTMF (Dual-Tone Multi-Frequency) tones are the beeps you hear when pressing phone keys. They're used for:
- Navigating IVR menus ("Press 1 for Sales")
- Entering PIN codes
- Conference call controls
- Voicemail systems

**How to send DTMF:**
1. Wait until call status shows "Call connected"
2. Use the **"Send DTMF Tones"** section that appears
3. Click the DTMF buttons (0-9, *, #), OR
4. Press keys on your keyboard

**Visual feedback:**
- Display will briefly show "Sent: [tone]"
- Receiving party will hear the tone

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| 0-9, *, # | Dial number / Send DTMF |
| Enter | Make call |
| Escape | Hang up |
| Backspace | Delete last digit |

### Ending a Call

- Click **"Hangup"** button, OR
- Press **Escape** key

---

## 🔧 Troubleshooting

### Issue: "Failed to initialize" Error

**Possible causes:**
1. **Invalid connection string**
   - Verify it's copied correctly from Azure Portal
   - Check for any extra spaces or missing characters
   - Ensure it starts with `endpoint=` and contains `;accesskey=`

2. **.env file not loaded**
   - Confirm `.env` file exists in project root
   - Check file permissions: `ls -la .env`
   - Restart Flask server after changing .env

3. **Network/firewall issues**
   - Check internet connection
   - Ensure no firewall blocking Azure endpoints
   - Try disabling VPN if active

**Solution:**
```bash
# Check current configuration
python3 -c "from config import Config; print(Config.AZURE_COMMUNICATION_CONNECTION_STRING[:30])"
```

### Issue: "Failed to get access token" Error

**Causes:**
- Azure resource not active
- Incorrect connection string
- Azure subscription expired

**Solution:**
1. Go to Azure Portal
2. Check Communication Services resource status
3. Verify billing/subscription is active
4. Regenerate keys if needed (Keys section)

### Issue: Call Not Connecting

**Possible causes:**
1. **Invalid phone number format**
   - Must include country code with +
   - Example: +12025551234 (not 2025551234)

2. **Phone number doesn't have calling capabilities**
   - Go to Azure Portal > Phone numbers
   - Check capabilities show "Make calls"

3. **Insufficient Azure credits**
   - Check Azure billing
   - Ensure payment method is valid

4. **Network issues**
   - Check browser console (F12) for errors
   - Verify WebRTC is supported in your browser

**Solution:**
```bash
# Test phone number format
python3 -c "from config import Config; print(Config.AZURE_PHONE_NUMBER)"
```

### Issue: No Microphone Access

**Causes:**
- Browser blocked microphone permission
- Microphone in use by another app
- HTTPS required (in production)

**Solution:**
1. Click the 🔒 icon in browser address bar
2. Set microphone to "Allow"
3. Refresh the page
4. Close other apps using microphone (Zoom, Teams, etc.)

### Issue: DTMF Not Working

**Causes:**
- Call not in "Connected" state
- Receiving system doesn't support DTMF

**Solution:**
1. Wait for status to show "Call connected"
2. Check browser console (F12) for errors
3. Try different DTMF tones
4. Verify receiving phone system supports DTMF

### Browser Console Debugging

**View detailed logs:**
1. Press **F12** in browser
2. Go to **Console** tab
3. Look for red error messages
4. Copy errors for support

**Common console messages:**
```javascript
// Good:
"Calling client initialized successfully"
"Call initiated: [call-id]"
"DTMF tone sent successfully: 1"

// Problems:
"Error initializing calling client: [error]"
"Failed to make call: [error]"
```

---

## 🚀 Production Deployment

### Security Requirements

1. **Enable HTTPS** (required for microphone access)
   - Use reverse proxy (nginx, Apache)
   - Get SSL certificate (Let's Encrypt is free)

2. **Update .env for production:**
   ```env
   CALLBACK_BASE_URL=https://your-domain.com
   SECRET_KEY=generate-random-secret-key
   DEBUG=False
   ```

3. **Add authentication**
   - Implement user login
   - Restrict dialer access to authorized users
   - Add rate limiting to prevent abuse

### Deployment Steps

1. **Use production WSGI server:**
   ```bash
   pip install gunicorn
   gunicorn -w 4 -b 0.0.0.0:8000 app:app
   ```

2. **Configure reverse proxy** (nginx example):
   ```nginx
   server {
       listen 443 ssl;
       server_name your-domain.com;

       ssl_certificate /path/to/cert.pem;
       ssl_certificate_key /path/to/key.pem;

       location / {
           proxy_pass http://127.0.0.1:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

3. **Configure Azure Event Grid** (for webhooks):
   - Azure Portal > Communication Services
   - Events section
   - Add webhook: `https://your-domain.com/api/call/events`

### Cost Optimization

**Azure Communication Services pricing:**
- Phone number: ~$1-2/month
- Outbound calls: $0.013-0.022/minute (US)
- Inbound calls: $0.0085/minute (US)
- PSTN connectivity: $0.004/minute

**Tips to reduce costs:**
1. Use toll-free numbers only if needed (more expensive)
2. Monitor usage in Azure portal
3. Set up billing alerts
4. Release unused phone numbers

---

## 📚 Additional Resources

### Documentation
- [Azure Communication Services Docs](https://learn.microsoft.com/en-us/azure/communication-services/)
- [Calling SDK JavaScript Reference](https://learn.microsoft.com/en-us/javascript/api/overview/azure/communication-calling)
- [DTMF Documentation](https://learn.microsoft.com/en-us/azure/communication-services/how-tos/calling-sdk/dtmf)

### Support
- **Azure Support**: [Azure Support Portal](https://azure.microsoft.com/en-us/support/)
- **Application Issues**: Check browser console and Flask server logs
- **Billing Questions**: Azure Portal > Cost Management

---

## 📂 Project Structure

```
AzureWebDialler2/
├── app.py                    # Flask application with routes
├── config.py                 # Configuration management
├── requirements.txt          # Python dependencies
├── .env                      # Your credentials (never commit!)
├── .env.example             # Template for .env
├── .gitignore               # Git ignore rules
├── AZURE_DIALER_README.md   # Technical documentation
├── SETUP_GUIDE.md           # This file
├── templates/
│   ├── index.html           # SEO analyzer homepage
│   ├── dialer.html          # Web dialer interface
│   ├── dialer_setup.html    # Setup error page
│   └── results.html         # SEO results page
└── static/
    └── dialer.js            # Calling SDK integration
```

---

## ✨ Quick Start Checklist

- [ ] Azure account created
- [ ] Communication Services resource created
- [ ] Connection string copied
- [ ] Phone number purchased
- [ ] .env file configured
- [ ] Python dependencies installed
- [ ] Flask server running
- [ ] Browser opened to http://localhost:5000/dialer
- [ ] Microphone permission granted
- [ ] Test call successful
- [ ] DTMF tones tested

---

## 🎉 Success Criteria

You're all set up when you can:
1. See "Ready to call" status in the web interface
2. Enter a phone number and click Call
3. Hear the call connect to the destination number
4. Send DTMF tones during an active call
5. Successfully end the call

---

**Need Help?**
- Check the browser console (F12) for JavaScript errors
- Check the Flask terminal for Python errors
- Review the [Troubleshooting](#troubleshooting) section
- Consult the [Azure Communication Services documentation](https://learn.microsoft.com/en-us/azure/communication-services/)

**Happy calling! 📞**
