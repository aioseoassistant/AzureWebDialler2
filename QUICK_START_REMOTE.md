# 🚀 Quick Start - Remote Server Deployment

Get your Azure Communication Services Web Dialer running on a remote server in minutes!

---

## ⚡ Super Quick Deployment (5 minutes)

### 1. Prerequisites

- Ubuntu/Debian server with SSH access
- Domain name pointing to your server (or public IP)
- Azure Communication Services resource setup (see below)

### 2. One-Command Deployment

SSH into your server and run:

```bash
# Clone repository
cd /var/www
sudo git clone https://github.com/aioseoassistant/AzureWebDialler2.git
cd AzureWebDialler2

# Run deployment script
sudo ./deploy.sh your-domain.com
```

**That's it!** The script will:
- Install all required packages
- Setup Python environment
- Configure Nginx
- Create systemd service
- Setup firewall

### 3. Configure Azure Credentials

Edit the `.env` file with your Azure details:

```bash
sudo nano /var/www/AzureWebDialler2/.env
```

Update these lines:
```env
AZURE_COMMUNICATION_CONNECTION_STRING=endpoint=https://your-resource.communication.azure.com/;accesskey=YOUR-KEY
AZURE_PHONE_NUMBER=+12345678901
```

Save and exit (Ctrl+X, Y, Enter)

### 4. Install SSL Certificate

```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

Follow the prompts to get a FREE SSL certificate.

### 5. Restart Application

```bash
sudo systemctl restart azuredialer
```

### 6. Test It!

Open your browser and go to:
```
https://your-domain.com/dialer
```

✅ **Done!** You should see the web dialer interface.

---

## 🔷 Azure Portal Setup (First Time Only)

If you haven't set up Azure Communication Services yet:

### Step 1: Create Communication Services Resource

1. Go to https://portal.azure.com
2. Click "Create a resource"
3. Search "Communication Services"
4. Click Create
5. Fill in:
   - Resource name: `my-dialer-acs`
   - Region: `United States`
6. Click "Review + create" → "Create"

### Step 2: Get Connection String

1. Go to your Communication Services resource
2. Click "Keys" in the left menu
3. Copy the "Connection string" (starts with `endpoint=`)
4. Save it for the .env file

### Step 3: Purchase Phone Number

1. In your resource, click "Phone numbers"
2. Click "Get" button
3. Select:
   - Country: United States (or your country)
   - Enable "Make calls"
4. Click "Search"
5. Select a number
6. Click "Place order"
7. Copy the phone number (format: +12345678901)

**Cost:** ~$1-2/month + per-minute call charges

---

## 🔧 Common Commands

### Check Application Status
```bash
sudo systemctl status azuredialer
```

### View Live Logs
```bash
sudo journalctl -u azuredialer -f
```

### Restart Application
```bash
sudo systemctl restart azuredialer
```

### Restart Nginx
```bash
sudo systemctl restart nginx
```

### Check SSL Certificate
```bash
sudo certbot certificates
```

### Renew SSL Certificate
```bash
sudo certbot renew
```

---

## 🐛 Troubleshooting

### Can't Access Website

**Check if Nginx is running:**
```bash
sudo systemctl status nginx
```

**Check if application is running:**
```bash
sudo systemctl status azuredialer
```

**Check firewall:**
```bash
sudo ufw status
```

### "Failed to Initialize" Error

**Check .env configuration:**
```bash
cat /var/www/AzureWebDialler2/.env
```

Make sure:
- Connection string is correct
- Phone number is correct
- No extra spaces or quotes

**Restart application:**
```bash
sudo systemctl restart azuredialer
```

### 502 Bad Gateway

**Check if port 8000 is listening:**
```bash
sudo netstat -tlnp | grep 8000
```

**Check application logs:**
```bash
sudo journalctl -u azuredialer -n 50
```

### No Microphone Access

**Make sure you're using HTTPS:**
- Browser address bar should show `https://` with a lock icon
- If not, check SSL certificate installation

---

## 📂 Important File Locations

- **Application:** `/var/www/AzureWebDialler2`
- **Configuration:** `/var/www/AzureWebDialler2/.env`
- **Nginx Config:** `/etc/nginx/sites-available/azuredialer`
- **Service File:** `/etc/systemd/system/azuredialer.service`
- **Logs:** `sudo journalctl -u azuredialer`

---

## 🔒 Security Tips

### Add Basic Password Protection

```bash
# Install apache2-utils
sudo apt install apache2-utils

# Create password
sudo htpasswd -c /etc/nginx/.htpasswd admin

# Edit Nginx config
sudo nano /etc/nginx/sites-available/azuredialer
```

Add these lines inside the `location /` block:
```nginx
auth_basic "Restricted Access";
auth_basic_user_file /etc/nginx/.htpasswd;
```

Restart Nginx:
```bash
sudo systemctl restart nginx
```

---

## 📊 Monitoring

### Check Resource Usage
```bash
htop
```

### Check Disk Space
```bash
df -h
```

### View Nginx Logs
```bash
sudo tail -f /var/log/nginx/azuredialer_access.log
sudo tail -f /var/log/nginx/azuredialer_error.log
```

---

## 🔄 Updating the Application

```bash
cd /var/www/AzureWebDialler2
sudo git pull origin main
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart azuredialer
```

---

## 📚 Full Documentation

For detailed information, see:
- **REMOTE_DEPLOYMENT.md** - Complete deployment guide
- **SETUP_GUIDE.md** - Azure setup walkthrough
- **AZURE_DIALER_README.md** - Technical documentation

---

## ✅ Deployment Checklist

Before going live:

- [ ] Server prepared with domain/IP
- [ ] Azure Communication Services resource created
- [ ] Phone number purchased
- [ ] Repository cloned to `/var/www/AzureWebDialler2`
- [ ] `deploy.sh` script executed
- [ ] `.env` file configured with Azure credentials
- [ ] SSL certificate installed
- [ ] Application running (`sudo systemctl status azuredialer`)
- [ ] Nginx running (`sudo systemctl status nginx`)
- [ ] Firewall configured
- [ ] Website accessible via HTTPS
- [ ] Microphone permission granted in browser
- [ ] Test call successful
- [ ] DTMF tones working

---

## 🆘 Need Help?

**Check logs first:**
```bash
# Application logs
sudo journalctl -u azuredialer -f

# Nginx error logs
sudo tail -f /var/log/nginx/azuredialer_error.log
```

**Verify configuration:**
```bash
# Test Nginx config
sudo nginx -t

# Check .env file
cat /var/www/AzureWebDialler2/.env

# Verify Azure credentials
cd /var/www/AzureWebDialler2
source venv/bin/activate
python3 -c "from config import Config; is_valid, errors = Config.validate(); print('✅ Config OK' if is_valid else f'❌ Errors: {errors}')"
```

---

**Ready to make calls! 📞**

Your web dialer should be live at: `https://your-domain.com/dialer`
