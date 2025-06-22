# 🚀 Deployment Guide

## Self-Hosted VPS Deployment

Deploy your Bridge Bidding Discussion Website on any VPS provider.

### One-Click Deployment

1. **Get a VPS** from any provider (Hetzner, DigitalOcean, Webdock, etc.)
2. **Run this single command:**
   ```bash
   curl -fsSL https://raw.githubusercontent.com/eddovandenboom/bridge-bidding-discussion-website/main/one-click-deploy.sh | sudo bash
   ```

That's it! Your app will be available at `http://your-server-ip`

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