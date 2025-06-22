#!/bin/bash

# 🚀 VPS Setup Script for Bridge Bidding Website
# Run: curl -fsSL https://raw.githubusercontent.com/eddovandenboom/bridge-bidding-discussion-website/main/vps-setup.sh | sudo bash

set -e

echo "🌉 Setting up VPS for Bridge Bidding Website..."
echo "==============================================="

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install essential packages
echo "🔧 Installing essential packages..."
apt install -y curl wget git unzip software-properties-common

# Install Node.js 18
echo "📜 Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Verify Node.js installation
echo "✅ Node.js version: $(node --version)"
echo "✅ NPM version: $(npm --version)"

# Install PostgreSQL
echo "🗄️ Installing PostgreSQL..."
apt install -y postgresql postgresql-contrib

# Start PostgreSQL service
systemctl start postgresql
systemctl enable postgresql

# Install PM2 (Process Manager)
echo "⚡ Installing PM2..."
npm install -g pm2

# Install Nginx
echo "🌐 Installing Nginx..."
apt install -y nginx

# Start and enable Nginx
systemctl start nginx
systemctl enable nginx

# Create application directory
echo "📁 Creating application directory..."
mkdir -p /var/www/bridge-app
chown -R www-data:www-data /var/www/bridge-app

# Setup PostgreSQL database
echo "🗄️ Setting up PostgreSQL database..."
sudo -u postgres psql << EOF
CREATE DATABASE bridge_bidding;
CREATE USER bridge_user WITH PASSWORD 'bridge_secure_password_123';
GRANT ALL PRIVILEGES ON DATABASE bridge_bidding TO bridge_user;
ALTER USER bridge_user CREATEDB;
\q
EOF

# Create environment file template
echo "📝 Creating environment template..."
cat > /root/.env.production << 'EOF'
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://bridge_user:bridge_secure_password_123@localhost:5432/bridge_bidding
JWT_SECRET=your_jwt_secret_here_change_this
FRONTEND_URL=http://your-server-ip:3001
EOF

# Create Nginx configuration
echo "🌐 Setting up Nginx configuration..."
cat > /etc/nginx/sites-available/bridge-app << 'EOF'
server {
    listen 80;
    server_name _;

    # Serve frontend static files
    location / {
        root /var/www/bridge-app/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to backend
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable Nginx site
ln -sf /etc/nginx/sites-available/bridge-app /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t

# Skip firewall setup - let VPS provider handle it
echo "⚠️  Skipping firewall setup - configure manually in your VPS control panel"
echo "   Required ports: 22 (SSH), 80 (HTTP), 443 (HTTPS), 3001 (API)"

# Create deployment script
echo "🔄 Creating deployment script..."
cat > /root/deploy-bridge-app.sh << 'EOF'
#!/bin/bash

# Deploy Bridge Bidding Website
echo "🚀 Deploying Bridge Bidding Website..."

# Navigate to app directory
cd /var/www/bridge-app

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build application
echo "🔨 Building application..."
npm run build

# Copy frontend build to Nginx directory
echo "📋 Copying frontend files..."
cp -r frontend/dist/* /var/www/bridge-app/frontend/dist/

# Set proper permissions
chown -R www-data:www-data /var/www/bridge-app

# Restart PM2 application
echo "🔄 Restarting application..."
pm2 restart bridge-app || pm2 start npm --name "bridge-app" -- run start:prod

# Reload Nginx
echo "🌐 Reloading Nginx..."
systemctl reload nginx

echo "✅ Deployment complete!"
echo "🌍 Your app should be available at: http://$(curl -s ifconfig.me)"
EOF

chmod +x /root/deploy-bridge-app.sh

# Create database backup script
echo "💾 Creating backup script..."
cat > /root/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backup"
mkdir -p $BACKUP_DIR
pg_dump -U bridge_user -h localhost bridge_bidding > $BACKUP_DIR/bridge_db_$(date +%Y%m%d_%H%M%S).sql
echo "✅ Database backup created: $BACKUP_DIR/bridge_db_$(date +%Y%m%d_%H%M%S).sql"
EOF

chmod +x /root/backup-db.sh

# Add daily backup cron job
echo "⏰ Setting up daily backup..."
(crontab -l 2>/dev/null; echo "0 2 * * * /root/backup-db.sh") | crontab -

# Create quick start script
echo "🎯 Creating quick start instructions..."
cat > /root/DEPLOYMENT_INSTRUCTIONS.txt << EOF
🌉 Bridge Bidding Website - Deployment Instructions
==================================================

Your VPS is ready! Here's how to deploy your app:

1. Clone your repository:
   cd /var/www/bridge-app
   git clone https://github.com/eddovandenboom/bridge-bidding-discussion-website.git .

2. Copy environment file:
   cp /root/.env.production .env

3. Update environment variables:
   nano .env
   (Change JWT_SECRET and FRONTEND_URL to your server IP)

4. Install and build:
   npm install
   npm run build

5. Run database migrations:
   npx prisma migrate deploy
   npx prisma generate

6. Start the application:
   pm2 start npm --name "bridge-app" -- run start:prod
   pm2 save
   pm2 startup

7. Copy frontend files:
   mkdir -p /var/www/bridge-app/frontend/dist
   cp -r frontend/dist/* /var/www/bridge-app/frontend/dist/

8. Set permissions:
   chown -R www-data:www-data /var/www/bridge-app

9. Restart Nginx:
   systemctl reload nginx

Your app will be available at: http://$(curl -s ifconfig.me)

📝 Database Info:
   - Database: bridge_bidding
   - User: bridge_user  
   - Password: bridge_secure_password_123
   - Host: localhost:5432

🔄 For future deployments:
   /root/deploy-bridge-app.sh

💾 Daily backups are automatically created in /backup/

🔧 Useful commands:
   - pm2 status          (check app status)
   - pm2 logs bridge-app (view app logs)
   - pm2 restart bridge-app (restart app)
   - systemctl status nginx (check nginx)

⚠️  FIREWALL: Configure in your VPS control panel
   Required ports: 22 (SSH), 80 (HTTP), 443 (HTTPS), 3001 (API)

EOF

echo ""
echo "✅ VPS setup complete!"
echo "📍 Your server IP: $(curl -s ifconfig.me)"
echo "📖 Next steps: cat /root/DEPLOYMENT_INSTRUCTIONS.txt"
echo ""
echo "🎉 Ready to deploy your Bridge Bidding Website!"
echo ""
echo "⚠️  IMPORTANT: Configure firewall in your VPS control panel"
echo "   Allow ports: 22, 80, 443, 3001"