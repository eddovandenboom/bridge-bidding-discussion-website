# 🔥 Deploy to Hetzner VPS (€7/month vs $175/month!)

Why pay $175/month when you can get the same for €7? Let's deploy to a real server!

## 💰 **Cost Comparison**
- **Render**: $175/month (8GB, 4 CPU) 
- **Hetzner**: €7/month (8GB, 4 vCPU) = **25x cheaper!**

## 🚀 **Hetzner VPS Setup**

### Step 1: Create Hetzner VPS
1. Go to [hetzner.com](https://www.hetzner.com/cloud)
2. Create account
3. **Create server**: CX31 (4 vCPU, 8GB RAM, €7.85/month)
4. **OS**: Ubuntu 22.04
5. **SSH Key**: Add your public key or use password

### Step 2: Server Setup Script
```bash
# SSH into your server
ssh root@your-server-ip

# Run this setup script
curl -fsSL https://raw.githubusercontent.com/eddovandenboom/bridge-bidding-discussion-website/main/hetzner-setup.sh | bash
```

### Step 3: Deploy Your App
```bash
# Clone your repo
git clone https://github.com/eddovandenboom/bridge-bidding-discussion-website.git
cd bridge-bidding-discussion-website

# Install dependencies
npm install

# Build the app
npm run build

# Start with PM2 (process manager)
pm2 start npm --name "bridge-app" -- run start:prod
pm2 save
pm2 startup
```

## 🗄️ **Database Setup**

### Option A: PostgreSQL on same server (Free)
```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database
sudo -u postgres createdb bridge_bidding
sudo -u postgres createuser bridge_user
sudo -u postgres psql -c "ALTER USER bridge_user PASSWORD 'your_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE bridge_bidding TO bridge_user;"
```

### Option B: Hetzner Managed Database (€5/month)
- Go to Hetzner Console → Databases
- Create PostgreSQL database
- Copy connection string

## 🌐 **Domain & SSL**

### Free Domain (Optional)
- Use your server IP: `http://your-server-ip:3001`
- Or get free subdomain: [noip.com](https://www.noip.com)

### Free SSL with Nginx
```bash
# Install Nginx
sudo apt install nginx

# Install Certbot for free SSL
sudo apt install certbot python3-certbot-nginx

# Setup SSL (if you have domain)
sudo certbot --nginx -d yourdomain.com
```

## 🔄 **Auto-Deploy Script**

Create webhook for auto-deploy on git push:
```bash
# On your server, create deploy script
cat > /home/deploy.sh << 'EOF'
#!/bin/bash
cd /root/bridge-bidding-discussion-website
git pull origin main
npm install
npm run build
pm2 restart bridge-app
EOF

chmod +x /home/deploy.sh
```

## 📊 **Total Monthly Cost**

| Service | Cost |
|---------|------|
| Hetzner VPS (8GB, 4 vCPU) | €7.85 |
| PostgreSQL (on same server) | €0 |
| Domain (optional) | €10/year |
| **Total** | **€7.85/month** |

vs Render: **$175/month** 🤡

## 🎯 **Why This is Better**

✅ **25x cheaper** than Render  
✅ **Full Linux server** - install anything  
✅ **Works exactly like localhost**  
✅ **No vendor lock-in**  
✅ **Root access** to everything  
✅ **Same performance** as expensive platforms  
✅ **Real CPU/RAM** not shared/throttled  

## 🔧 **Backup Strategy**

```bash
# Daily database backup
crontab -e
# Add this line:
0 2 * * * pg_dump bridge_bidding > /backup/db_$(date +%Y%m%d).sql

# Weekly full backup to another Hetzner server or S3
```

## 🆘 **Need Help?**

If you want me to help you set this up step by step, I can create the setup script and walk you through it. 

**Stop paying $175/month for what costs €7!** 💸