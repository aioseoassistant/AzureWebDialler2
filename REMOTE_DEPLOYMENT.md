# 🌐 Remote Server Deployment Guide
## Azure Communication Services Web Dialer

This guide covers deploying the web dialer application on a remote server with HTTPS support.

---

## 📋 Prerequisites

Before starting, ensure you have:

- ✅ Remote server with SSH access (Ubuntu 20.04+ or similar Linux)
- ✅ Domain name pointing to your server (or public IP address)
- ✅ Root or sudo access
- ✅ Port 80 and 443 open on firewall
- ✅ Azure Communication Services resource (see SETUP_GUIDE.md)

---

## 🚀 Quick Deployment Steps

### 1. Server Preparation

```bash
# SSH into your server
ssh user@your-server.com

# Update system packages
sudo apt update && sudo apt upgrade -y

# Install required system packages
sudo apt install -y python3 python3-pip python3-venv nginx certbot python3-certbot-nginx git

# Install Python 3.11+ if not available
python3 --version  # Should be 3.8 or higher
```

### 2. Clone and Setup Application

```bash
# Navigate to web directory
cd /var/www

# Clone your repository (or upload files via SCP/SFTP)
sudo git clone https://github.com/aioseoassistant/AzureWebDialler2.git
cd AzureWebDialler2

# Set proper permissions
sudo chown -R $USER:$USER /var/www/AzureWebDialler2

# Create Python virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt
```

### 3. Configure Environment Variables

```bash
# Copy the example .env file
cp .env.example .env

# Edit the .env file
nano .env
```

**Update these critical values:**

```env
# Your Azure connection string (from Azure Portal)
AZURE_COMMUNICATION_CONNECTION_STRING=endpoint=https://your-resource.communication.azure.com/;accesskey=YOUR-KEY-HERE

# Your Azure phone number
AZURE_PHONE_NUMBER=+12345678901

# Your public HTTPS URL (IMPORTANT!)
CALLBACK_BASE_URL=https://your-domain.com

# Generate a secure secret key
SECRET_KEY=<generate-random-key-here>

# Production mode
DEBUG=False
```

**Generate a secure secret key:**
```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
# Copy the output and paste it as SECRET_KEY in .env
```

### 4. Test the Application

```bash
# Make sure virtual environment is activated
source venv/bin/activate

# Test with Gunicorn
gunicorn --bind 0.0.0.0:8000 app:app

# Open another terminal and test
curl http://localhost:8000/dialer
# You should see HTML output

# Press Ctrl+C to stop the test server
```

### 5. Setup Nginx Reverse Proxy

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/azuredialer
```

**Paste this configuration:**

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support (if needed in future)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Increase timeout for long calls
    proxy_connect_timeout 600;
    proxy_send_timeout 600;
    proxy_read_timeout 600;
    send_timeout 600;
}
```

**Replace `your-domain.com` with your actual domain!**

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/azuredialer /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### 6. Setup SSL Certificate (HTTPS)

**CRITICAL:** Microphone access requires HTTPS in browsers!

```bash
# Install SSL certificate with Let's Encrypt (FREE)
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Follow the prompts:
# - Enter your email address
# - Agree to terms of service
# - Choose to redirect HTTP to HTTPS (option 2)

# Certbot will automatically configure Nginx for HTTPS
```

**Test auto-renewal:**
```bash
sudo certbot renew --dry-run
```

### 7. Create Systemd Service

Create a service to run the application automatically:

```bash
sudo nano /etc/systemd/system/azuredialer.service
```

**Paste this configuration:**

```ini
[Unit]
Description=Azure Communication Services Web Dialer
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/AzureWebDialler2
Environment="PATH=/var/www/AzureWebDialler2/venv/bin"
ExecStart=/var/www/AzureWebDialler2/venv/bin/gunicorn --workers 3 --bind 127.0.0.1:8000 app:app
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Adjust permissions and start the service:**

```bash
# Set proper ownership for www-data
sudo chown -R www-data:www-data /var/www/AzureWebDialler2

# Reload systemd
sudo systemctl daemon-reload

# Enable service to start on boot
sudo systemctl enable azuredialer

# Start the service
sudo systemctl start azuredialer

# Check status
sudo systemctl status azuredialer
```

### 8. Configure Firewall

```bash
# Allow HTTP and HTTPS through firewall
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable

# Check status
sudo ufw status
```

### 9. Verify Deployment

**Test your application:**

1. Open browser and go to: `https://your-domain.com/dialer`
2. You should see the web dialer interface
3. Grant microphone permissions when prompted
4. Verify "Ready to call" status appears

**Check logs if there are issues:**
```bash
# Application logs
sudo journalctl -u azuredialer -f

# Nginx error logs
sudo tail -f /var/nginx/error.log

# Nginx access logs
sudo tail -f /var/nginx/access.log
```

---

## 🔧 Configuration Files Reference

### Environment Variables (.env)

```env
# Azure Configuration
AZURE_COMMUNICATION_CONNECTION_STRING=endpoint=https://...;accesskey=...
AZURE_PHONE_NUMBER=+12345678901
CALLBACK_BASE_URL=https://your-domain.com

# Application Configuration
SECRET_KEY=your-64-character-random-hex-string
DEBUG=False
```

### Gunicorn Configuration

For advanced configuration, create `gunicorn_config.py`:

```python
# gunicorn_config.py
bind = "127.0.0.1:8000"
workers = 3
worker_class = "sync"
worker_connections = 1000
timeout = 120
keepalive = 5
errorlog = "/var/log/azuredialer/error.log"
accesslog = "/var/log/azuredialer/access.log"
loglevel = "info"
```

Create log directory:
```bash
sudo mkdir -p /var/log/azuredialer
sudo chown www-data:www-data /var/log/azuredialer
```

Update systemd service to use config:
```bash
sudo nano /etc/systemd/system/azuredialer.service
# Change ExecStart line to:
ExecStart=/var/www/AzureWebDialler2/venv/bin/gunicorn -c gunicorn_config.py app:app
```

---

## 🔒 Security Best Practices

### 1. Secure .env File

```bash
# Ensure .env is not world-readable
chmod 600 /var/www/AzureWebDialler2/.env
sudo chown www-data:www-data /var/www/AzureWebDialler2/.env
```

### 2. Add Authentication (Recommended)

The current application doesn't have user authentication. Consider adding:
- Basic HTTP authentication via Nginx
- Flask-Login for user management
- OAuth integration (Google, Microsoft, etc.)

**Quick Nginx Basic Auth:**
```bash
# Install apache2-utils
sudo apt install apache2-utils

# Create password file
sudo htpasswd -c /etc/nginx/.htpasswd admin

# Add to Nginx config under 'location /'
auth_basic "Restricted Access";
auth_basic_user_file /etc/nginx/.htpasswd;

# Restart Nginx
sudo systemctl restart nginx
```

### 3. Rate Limiting

Add to Nginx configuration to prevent abuse:

```nginx
# Add before server block
limit_req_zone $binary_remote_addr zone=dialer_limit:10m rate=10r/m;

# Add inside location block
location / {
    limit_req zone=dialer_limit burst=5;
    # ... rest of proxy config
}
```

### 4. Fail2Ban (Optional)

Protect against brute force attacks:

```bash
sudo apt install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## 📊 Monitoring and Maintenance

### Check Application Status

```bash
# Check if service is running
sudo systemctl status azuredialer

# View recent logs
sudo journalctl -u azuredialer -n 100

# Follow logs in real-time
sudo journalctl -u azuredialer -f
```

### Restart Application

```bash
# Restart the application
sudo systemctl restart azuredialer

# Restart Nginx
sudo systemctl restart nginx
```

### Update Application

```bash
# Pull latest changes
cd /var/www/AzureWebDialler2
git pull origin main

# Activate virtual environment
source venv/bin/activate

# Update dependencies
pip install -r requirements.txt

# Restart application
sudo systemctl restart azuredialer
```

### SSL Certificate Renewal

Certificates auto-renew, but you can manually renew:

```bash
sudo certbot renew
sudo systemctl restart nginx
```

### Monitor Resource Usage

```bash
# Check CPU and memory usage
htop

# Check disk space
df -h

# Check application process
ps aux | grep gunicorn
```

---

## 🐛 Troubleshooting

### Issue: 502 Bad Gateway

**Causes:**
- Application not running
- Gunicorn crashed
- Port 8000 not listening

**Solutions:**
```bash
# Check if application is running
sudo systemctl status azuredialer

# Check if port 8000 is listening
sudo netstat -tlnp | grep 8000

# Restart application
sudo systemctl restart azuredialer

# Check logs for errors
sudo journalctl -u azuredialer -n 100
```

### Issue: SSL Certificate Errors

**Causes:**
- Certificate not properly installed
- Mixed content (HTTP/HTTPS)
- Expired certificate

**Solutions:**
```bash
# Re-run certbot
sudo certbot --nginx -d your-domain.com

# Force certificate renewal
sudo certbot renew --force-renewal

# Check certificate status
sudo certbot certificates
```

### Issue: "Failed to initialize" in Browser

**Causes:**
- Azure connection string incorrect
- .env file not loaded
- DEBUG=True when it should be False

**Solutions:**
```bash
# Verify .env file exists and has correct values
cat /var/www/AzureWebDialler2/.env

# Check file permissions
ls -la /var/www/AzureWebDialler2/.env

# Restart application
sudo systemctl restart azuredialer

# Check application logs
sudo journalctl -u azuredialer -f
```

### Issue: No Microphone Access

**Causes:**
- Site not served over HTTPS
- Browser permissions blocked
- Mixed content warnings

**Solutions:**
1. Ensure site uses HTTPS (check browser address bar)
2. Click lock icon → Permissions → Allow microphone
3. Clear browser cache and reload
4. Check browser console (F12) for errors

### Issue: DTMF Tones Not Working

**Causes:**
- Call not in connected state
- Azure SDK version mismatch

**Solutions:**
1. Ensure call status shows "Call connected"
2. Check browser console for errors
3. Verify Azure Calling SDK is loaded (check browser developer tools → Network tab)

---

## 📈 Performance Optimization

### 1. Increase Gunicorn Workers

For servers with more CPU cores:

```bash
# Edit systemd service
sudo nano /etc/systemd/system/azuredialer.service

# Change workers based on: (2 x CPU cores) + 1
# For 2 cores: --workers 5
# For 4 cores: --workers 9
ExecStart=/var/www/AzureWebDialler2/venv/bin/gunicorn --workers 5 --bind 127.0.0.1:8000 app:app

# Reload and restart
sudo systemctl daemon-reload
sudo systemctl restart azuredialer
```

### 2. Enable Nginx Caching

Add to Nginx config:

```nginx
# Add before server block
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=dialer_cache:10m max_size=100m;

# Add inside location block
proxy_cache dialer_cache;
proxy_cache_valid 200 5m;
proxy_cache_bypass $http_cache_control;
```

### 3. Enable Gzip Compression

Add to Nginx config inside server block:

```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;
```

---

## 💰 Cost Monitoring

### Azure Costs

Monitor your Azure Communication Services costs:

1. Go to Azure Portal
2. Navigate to Cost Management + Billing
3. Set up budget alerts
4. Monitor usage under Communication Services resource

**Typical costs:**
- Phone number: $1-2/month
- Outbound calls: $0.013-0.022/minute (US)
- Inbound calls: $0.0085/minute (US)

### Server Costs

- VPS/Cloud Server: $5-20/month (DigitalOcean, Linode, AWS EC2, etc.)
- Domain: $10-15/year
- SSL Certificate: FREE (Let's Encrypt)

---

## 🔄 Backup Strategy

### 1. Backup Configuration

```bash
# Backup .env file
sudo cp /var/www/AzureWebDialler2/.env /root/backups/env_backup_$(date +%Y%m%d)

# Backup Nginx config
sudo cp /etc/nginx/sites-available/azuredialer /root/backups/nginx_backup_$(date +%Y%m%d)
```

### 2. Automated Backups (Optional)

Create a backup script:

```bash
sudo nano /usr/local/bin/backup_azuredialer.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/root/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup configuration
cp /var/www/AzureWebDialler2/.env $BACKUP_DIR/env_$DATE
cp /etc/nginx/sites-available/azuredialer $BACKUP_DIR/nginx_$DATE
cp /etc/systemd/system/azuredialer.service $BACKUP_DIR/service_$DATE

# Delete backups older than 30 days
find $BACKUP_DIR -name "env_*" -mtime +30 -delete
find $BACKUP_DIR -name "nginx_*" -mtime +30 -delete
find $BACKUP_DIR -name "service_*" -mtime +30 -delete

echo "Backup completed: $DATE"
```

Make executable and add to cron:

```bash
sudo chmod +x /usr/local/bin/backup_azuredialer.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e
# Add this line:
0 2 * * * /usr/local/bin/backup_azuredialer.sh >> /var/log/azuredialer_backup.log 2>&1
```

---

## 📞 Testing Checklist

After deployment, verify:

- [ ] Site accessible via HTTPS
- [ ] SSL certificate valid (green lock icon)
- [ ] Dialer interface loads without errors
- [ ] Microphone permission prompt appears
- [ ] "Ready to call" status shows
- [ ] Can enter phone number
- [ ] Call button enabled after entering number
- [ ] Can make outbound call successfully
- [ ] DTMF buttons work during active call
- [ ] Call timer counts up correctly
- [ ] Can hang up call successfully
- [ ] Check browser console for errors (F12)
- [ ] Check server logs for errors

---

## 🆘 Support and Resources

- **Azure Communication Services Docs**: https://learn.microsoft.com/en-us/azure/communication-services/
- **Nginx Documentation**: https://nginx.org/en/docs/
- **Gunicorn Documentation**: https://docs.gunicorn.org/
- **Let's Encrypt**: https://letsencrypt.org/
- **Certbot**: https://certbot.eff.org/

---

## ✅ Deployment Checklist

**Before going live:**

- [ ] Azure Communication Services resource created
- [ ] Phone number purchased and configured
- [ ] .env file configured with correct values
- [ ] SECRET_KEY generated and set
- [ ] DEBUG=False in production
- [ ] Dependencies installed
- [ ] Gunicorn tested successfully
- [ ] Nginx configured and tested
- [ ] SSL certificate installed
- [ ] Systemd service created and enabled
- [ ] Firewall configured
- [ ] Basic authentication added (optional but recommended)
- [ ] Backups configured
- [ ] Monitoring set up
- [ ] Tested full call flow
- [ ] Tested DTMF functionality
- [ ] Reviewed logs for errors

---

**Your web dialer is now deployed and ready for production use! 📞**

For additional help, refer to SETUP_GUIDE.md and AZURE_DIALER_README.md.
