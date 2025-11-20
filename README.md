# AI SEO Assistant + Azure Web Dialer

A multi-purpose web application featuring:

## SEO Assistant
- Crawls websites (with JavaScript rendering using Playwright)
- Analyzes SEO elements: title, meta tags, headings, alt text
- Generates smart suggestions using AI (OpenAI)

## Azure Web Dialer
- Make and receive voice calls through your browser
- DTMF (Dual-Tone Multi-Frequency) support for IVR systems
- Real-time call status and duration tracking
- Professional web-based phone interface
- Built with Azure Communication Services

---

## Setup Instructions

### 1. Clone or download the project
```
git clone <your-repo-url>  # or download the ZIP from this assistant
cd ai_seo_assistant
```

### 2. Create a virtual environment (recommended)
```
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install dependencies
```
pip install -r requirements.txt
python -m playwright install
```

### 4. Configure Azure Web Dialer (Optional)

To enable the web dialer functionality:

1. Create an Azure Communication Services resource
2. Acquire a phone number with voice capabilities
3. Copy `.env.example` to `.env` and add your credentials:
   ```
   AZURE_COMMUNICATION_CONNECTION_STRING=endpoint=https://...
   AZURE_PHONE_NUMBER=+1234567890
   ```

See [AZURE_DIALER_README.md](AZURE_DIALER_README.md) for detailed setup instructions.

### 5. Run the app
```
python app.py
```

Go to `http://localhost:5000` in your browser.

**Access the Web Dialer:** `http://localhost:5000/dialer`

---

## Features

### SEO Analyzer
- Crawl depth configuration (1-5 levels)
- JavaScript rendering support
- Internal link discovery
- Comprehensive SEO metrics

### Web Dialer
- Voice calling from browser
- DTMF tone support for IVR systems
- Real-time call timer
- Keyboard shortcuts for dialing
- Microphone device management

---

## Optional Enhancements
- Connect OpenAI API for SEO meta tag generation
- Export SEO reports to PDF/HTML
- Implement call recording (Azure feature)
- Add user authentication for dialer

---

## Stack
- Python + Flask
- Playwright (Chromium headless browser)
- BeautifulSoup
- Azure Communication Services (voice calling)
- WebRTC (browser calling)
- OpenAI (optional)