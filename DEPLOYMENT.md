# 🚀 Deployment Guide

## Self-Hosted VPS Deployment

Deploy your Bridge Bidding Discussion Website on any VPS provider.

### Quick Setup

1. **Get a VPS** from any provider (Hetzner, DigitalOcean, Webdock, etc.)
2. **Run the setup script:**
   ```bash
   curl -fsSL https://raw.githubusercontent.com/eddovandenboom/bridge-bidding-discussion-website/main/vps-setup.sh | sudo bash
   ```

3. **Deploy your application:**
   ```bash
   cd /var/www/bridge-app
   git clone https://github.com/eddovandenboom/bridge-bidding-discussion-website.git .
   cp /root/.env.production .env
   nano .env  # Update JWT_SECRET and FRONTEND_URL
   npm install && npm run build
   npx prisma migrate deploy && npx prisma generate
   pm2 start npm --name "bridge-app" -- run start:prod
   pm2 save && pm2 startup
   ```

4. **Configure firewall** in your VPS control panel:
   - Allow ports: 22 (SSH), 80 (HTTP), 443 (HTTPS), 3001 (API)

### What Gets Installed

- ✅ Node.js 18
- ✅ PostgreSQL database
- ✅ Nginx web server
- ✅ PM2 process manager
- ✅ Automatic deployment scripts
- ✅ Daily database backups

### Your App Will Be Available At

`http://your-server-ip`

### Management Commands

```bash
pm2 status              # Check app status
pm2 logs bridge-app     # View app logs
pm2 restart bridge-app  # Restart app
/root/deploy-bridge-app.sh  # Deploy updates
```

### Requirements

- VPS with at least 1GB RAM
- Ubuntu 20.04+ or Debian 11+ recommended
- Root or sudo access