#!/bin/bash

# Bridge Bidding Discussion Website - One-Click Deployment
# Run with: curl -fsSL https://raw.githubusercontent.com/eddovandenboom/bridge-bidding-discussion-website/main/one-click-deploy.sh | sudo bash

set -e

echo "🚀 Starting Bridge Bidding Discussion Website deployment..."

# Install dependencies
echo "📦 Installing dependencies..."
apt update && apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs postgresql postgresql-contrib nginx

# Setup PostgreSQL with proper permissions
echo "🗄️ Setting up PostgreSQL..."
systemctl start postgresql
systemctl enable postgresql

# Create database and user with all permissions
sudo -u postgres psql -c "DROP DATABASE IF EXISTS bridge_bidding;"
sudo -u postgres psql -c "DROP USER IF EXISTS bridge_user;"
sudo -u postgres psql -c "CREATE USER bridge_user WITH PASSWORD 'bridge_password_2024';"
sudo -u postgres psql -c "CREATE DATABASE bridge_bidding OWNER bridge_user;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE bridge_bidding TO bridge_user;"
sudo -u postgres psql -d bridge_bidding -c "GRANT ALL ON SCHEMA public TO bridge_user;"
sudo -u postgres psql -d bridge_bidding -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO bridge_user;"
sudo -u postgres psql -d bridge_bidding -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO bridge_user;"

# Install PM2 globally
npm install -g pm2

# Setup application directory
echo "📁 Setting up application..."
rm -rf /var/www/bridge-app
mkdir -p /var/www/bridge-app
cd /var/www/bridge-app

# Clone repository
git clone https://github.com/eddovandenboom/bridge-bidding-discussion-website.git .

# Create environment file
echo "⚙️ Setting up environment..."
cat > backend/.env << EOF
DATABASE_URL="postgresql://bridge_user:bridge_password_2024@localhost:5432/bridge_bidding"
JWT_SECRET="$(openssl rand -base64 32)"
NODE_ENV="production"
PORT=3001
FRONTEND_URL="http://$(curl -s ifconfig.me)"
EOF

# Install dependencies and build
echo "🔧 Building application..."
npm install
cd backend
npx prisma migrate deploy
npx prisma generate
npx prisma db seed
cd ..
npm run build

# Setup Nginx
echo "🌐 Setting up web server..."
cat > /etc/nginx/sites-available/bridge-app << EOF
server {
    listen 80;
    server_name _;
    
    # Serve frontend
    location / {
        root /var/www/bridge-app/frontend/dist;
        try_files \$uri \$uri/ /index.html;
    }
    
    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

ln -sf /etc/nginx/sites-available/bridge-app /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

# Start application with PM2
echo "🚀 Starting application..."
cd /var/www/bridge-app
pm2 delete bridge-app 2>/dev/null || true
pm2 start npm --name "bridge-app" -- run start:prod
pm2 save
pm2 startup systemd -u root --hp /root

# Setup firewall
echo "🔒 Setting up firewall..."
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Get server IP
SERVER_IP=$(curl -s ifconfig.me)

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Your Bridge Bidding Discussion Website is now available at:"
echo "   http://$SERVER_IP"
echo ""
echo "📊 Management commands:"
echo "   pm2 status              # Check app status"
echo "   pm2 logs bridge-app     # View logs"
echo "   pm2 restart bridge-app  # Restart app"
echo ""
echo "🗄️ Database info:"
echo "   Host: localhost"
echo "   Database: bridge_bidding"
echo "   User: bridge_user"
echo "   Password: bridge_password_2024"
echo ""