#!/bin/bash

# Azure Communication Services Web Dialer - Quick Deployment Script
# This script automates the deployment process on a remote Ubuntu/Debian server
#
# Usage:
# chmod +x deploy.sh
# sudo ./deploy.sh your-domain.com

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root or with sudo${NC}"
    exit 1
fi

# Check if domain provided
if [ -z "$1" ]; then
    echo -e "${RED}Usage: sudo ./deploy.sh your-domain.com${NC}"
    exit 1
fi

DOMAIN=$1
APP_DIR="/var/www/AzureWebDialler2"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Azure Web Dialer Deployment Script${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Domain: ${YELLOW}$DOMAIN${NC}"
echo -e "App Directory: ${YELLOW}$APP_DIR${NC}"
echo ""

# Update system packages
echo -e "${GREEN}[1/9] Updating system packages...${NC}"
apt update && apt upgrade -y

# Install required packages
echo -e "${GREEN}[2/9] Installing required packages...${NC}"
apt install -y python3 python3-pip python3-venv nginx certbot python3-certbot-nginx git htop

# Create application directory if it doesn't exist
if [ ! -d "$APP_DIR" ]; then
    echo -e "${YELLOW}Application directory doesn't exist. Please clone or upload your code to $APP_DIR${NC}"
    exit 1
fi

# Navigate to app directory
cd $APP_DIR

# Create virtual environment
echo -e "${GREEN}[3/9] Setting up Python virtual environment...${NC}"
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

# Activate virtual environment and install dependencies
echo -e "${GREEN}[4/9] Installing Python dependencies...${NC}"
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Check if .env file exists
echo -e "${GREEN}[5/9] Checking configuration...${NC}"
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Creating .env file from template...${NC}"
    cp .env.example .env
    echo -e "${RED}IMPORTANT: Edit .env file with your Azure credentials!${NC}"
    echo -e "${YELLOW}Run: nano $APP_DIR/.env${NC}"
fi

# Generate secret key if needed
if grep -q "CHANGE-THIS-TO-A-RANDOM-SECRET-KEY" .env; then
    echo -e "${YELLOW}Generating random SECRET_KEY...${NC}"
    SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_hex(32))")
    sed -i "s/SECRET_KEY=.*/SECRET_KEY=$SECRET_KEY/" .env
    echo -e "${GREEN}Secret key generated!${NC}"
fi

# Update domain in .env
echo -e "${YELLOW}Updating CALLBACK_BASE_URL in .env...${NC}"
sed -i "s|CALLBACK_BASE_URL=.*|CALLBACK_BASE_URL=https://$DOMAIN|" .env

# Configure Nginx
echo -e "${GREEN}[6/9] Configuring Nginx...${NC}"
cat > /etc/nginx/sites-available/azuredialer <<EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_connect_timeout 600;
        proxy_send_timeout 600;
        proxy_read_timeout 600;
    }

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    access_log /var/log/nginx/azuredialer_access.log;
    error_log /var/log/nginx/azuredialer_error.log;
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/azuredialer /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t

# Restart Nginx
systemctl restart nginx

# Create systemd service
echo -e "${GREEN}[7/9] Creating systemd service...${NC}"
cp azuredialer.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable azuredialer
systemctl start azuredialer

# Set proper permissions
echo -e "${GREEN}[8/9] Setting permissions...${NC}"
chown -R www-data:www-data $APP_DIR
chmod 600 $APP_DIR/.env

# Configure firewall
echo -e "${GREEN}[9/9] Configuring firewall...${NC}"
ufw allow 'Nginx Full'
ufw allow OpenSSH
ufw --force enable

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Next steps:"
echo -e "1. ${YELLOW}Edit .env file:${NC} nano $APP_DIR/.env"
echo -e "   - Add your Azure connection string"
echo -e "   - Add your Azure phone number"
echo ""
echo -e "2. ${YELLOW}Install SSL certificate:${NC}"
echo -e "   sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo ""
echo -e "3. ${YELLOW}Restart the application:${NC}"
echo -e "   sudo systemctl restart azuredialer"
echo ""
echo -e "4. ${YELLOW}Test your dialer:${NC}"
echo -e "   https://$DOMAIN/dialer"
echo ""
echo -e "Check logs: ${YELLOW}sudo journalctl -u azuredialer -f${NC}"
echo -e "Check status: ${YELLOW}sudo systemctl status azuredialer${NC}"
echo ""
