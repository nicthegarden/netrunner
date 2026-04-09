# NETRUNNER Multiplayer Backend - Deployment Guide
## Phase 8: Production Deployment Setup

This guide covers deploying the NETRUNNER multiplayer backend to production using Docker, PM2, and DigitalOcean.

---

## Quick Start

### Option 1: Docker Compose (Recommended for testing)

```bash
# Clone repository
git clone https://github.com/nicthegarden/netrunner.git
cd netrunner/backend

# Create .env file
cp .env.example .env
# Edit .env with your secrets:
#   JWT_SECRET=your-secret-key
#   SESSION_SECRET=your-session-secret
#   GITHUB_OAUTH_ID=your-github-app-id
#   GITHUB_OAUTH_SECRET=your-github-app-secret
#   etc.

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

### Option 2: PM2 (Recommended for production)

```bash
# Install PM2 globally
npm install -g pm2

# Start application with PM2
pm2 start ecosystem.config.js --env production

# Monitor
pm2 monit

# View logs
pm2 logs netrunner-backend

# Auto-restart on reboot
pm2 startup
pm2 save
```

---

## Docker Deployment

### Building Docker Image

```bash
# Build image
docker build -t netrunner-backend:latest .

# Tag for registry
docker tag netrunner-backend:latest your-registry.com/netrunner-backend:latest

# Push to registry
docker push your-registry.com/netrunner-backend:latest
```

### Docker Compose Services

The `docker-compose.yml` includes:

1. **Backend** - Node.js server on port 3000
2. **MongoDB** - Database on port 27017
3. **Redis** - Cache on port 6379
4. **Nginx** - Reverse proxy on ports 80/443

### Environment Variables

Create `.env` file:

```env
# Server
NODE_ENV=production
PORT=3000

# Database
MONGODB_URI=mongodb://admin:password@mongo:27017/netrunner?authSource=admin
MONGO_USER=admin
MONGO_PASSWORD=your-secure-password

# Cache
REDIS_URL=redis://:redis123@redis:6379
REDIS_PASSWORD=redis123

# JWT & Session
JWT_SECRET=your-very-long-random-secret-key
JWT_EXPIRES_IN=24h
SESSION_SECRET=your-session-secret-key

# OAuth
GITHUB_OAUTH_ID=your-github-oauth-app-id
GITHUB_OAUTH_SECRET=your-github-oauth-app-secret
GOOGLE_OAUTH_ID=your-google-oauth-app-id
GOOGLE_OAUTH_SECRET=your-google-oauth-app-secret

# Features
ENABLE_BOTS=true
ENABLE_EVENTS=true
ENABLE_PVP=true
ENABLE_GUILDS=true

# CORS
CORS_ORIGIN=https://netrunner.game

# Email (optional, for notifications)
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@netrunner.game
```

### Health Checks

Docker Compose includes health checks for all services:

```bash
# Check health
docker-compose ps

# Force health check
docker-compose exec backend node -e "require('http').get('http://localhost:3000/api/players/leaderboard', (r) => console.log(r.statusCode))"
```

---

## PM2 Deployment

### Installation

```bash
# Install PM2
npm install -g pm2

# Install PM2 modules
pm2 install pm2-auto-pull
pm2 install pm2-logrotate
```

### Cluster Mode

PM2 automatically uses cluster mode for multiple CPU cores:

```bash
# Auto-detects CPU count
pm2 start ecosystem.config.js --env production

# Explicitly set instances
pm2 start ecosystem.config.js -i 4
```

### Monitoring

```bash
# Real-time monitoring
pm2 monit

# View logs (last 100 lines)
pm2 logs netrunner-backend --lines 100

# Clear logs
pm2 flush

# View specific log
cat logs/pm2-out.log
```

### Auto-restart on Boot

```bash
# Generate startup script
pm2 startup

# Save PM2 process list
pm2 save

# On reboot, PM2 will auto-start all processes
```

### Rolling Restart

For zero-downtime deploys:

```bash
# Update code
git pull origin main

# Install dependencies
npm install --production

# Rolling restart (one process at a time)
pm2 reload ecosystem.config.js
```

---

## Nginx Reverse Proxy

The `nginx.conf` provides:

- HTTPS/SSL termination
- Rate limiting
- Compression
- Security headers
- WebSocket support
- Load balancing
- Caching

### SSL Certificate Setup

Using Let's Encrypt with Certbot:

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Generate certificate
sudo certbot certonly --standalone -d netrunner.game -d api.netrunner.game

# Copy certificates
sudo cp /etc/letsencrypt/live/netrunner.game/fullchain.pem backend/ssl/cert.pem
sudo cp /etc/letsencrypt/live/netrunner.game/privkey.pem backend/ssl/key.pem

# Auto-renewal
sudo certbot renew --quiet --no-eff-email
# Add to crontab: 0 2 * * * /usr/bin/certbot renew --quiet
```

### Testing Nginx Configuration

```bash
# Validate configuration
docker run --rm -v $(pwd)/nginx.conf:/etc/nginx/nginx.conf:ro nginx:alpine nginx -t

# Start Nginx
docker-compose up -d nginx

# Test endpoints
curl -I https://netrunner.game/api/players/leaderboard
```

---

## DigitalOcean Deployment

### 1. Create Droplet

```bash
# Create Ubuntu 22.04 LTS droplet (4GB RAM, $20/month)
doctl compute droplet create netrunner-backend \
  --region nyc3 \
  --size s-2vcpu-4gb-intel \
  --image ubuntu-22-04-x64 \
  --wait

# Note the IP address
doctl compute droplet get netrunner-backend
```

### 2. SSH Setup

```bash
# Add SSH key
doctl compute ssh-key import netrunner-key --public-key-file ~/.ssh/id_rsa.pub

# SSH into droplet
ssh root@<droplet-ip>

# Create app user
useradd -m -s /bin/bash appuser
su appuser
```

### 3. Install Dependencies

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt-get install -y nginx

# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx
```

### 4. Clone Repository

```bash
# Clone repo
git clone https://github.com/nicthegarden/netrunner.git ~/netrunner
cd ~/netrunner/backend

# Create .env file
cp .env.example .env
# Edit with secure values
nano .env
```

### 5. Configure Firewall

```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow 22

# Allow HTTP/HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Allow MongoDB only from localhost
sudo ufw allow from 127.0.0.1 to 127.0.0.1 port 27017

# Check rules
sudo ufw status
```

### 6. Deploy with Docker Compose

```bash
# Start services
cd ~/netrunner/backend
docker-compose up -d

# Verify
docker-compose ps

# View logs
docker-compose logs -f backend
```

### 7. Configure Nginx

```bash
# Copy Nginx config
sudo cp ~/netrunner/backend/nginx.conf /etc/nginx/nginx.conf

# Test configuration
sudo nginx -t

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 8. Set Up SSL Certificate

```bash
# Generate certificate
sudo certbot certonly --standalone -d netrunner.game

# Copy to Docker volume
sudo cp /etc/letsencrypt/live/netrunner.game/fullchain.pem ~/netrunner/backend/ssl/cert.pem
sudo cp /etc/letsencrypt/live/netrunner.game/privkey.pem ~/netrunner/backend/ssl/key.pem

# Fix permissions
sudo chown $USER:$USER ~/netrunner/backend/ssl/*

# Restart Nginx
sudo systemctl restart nginx
```

### 9. MongoDB Atlas (Cloud Database)

Instead of local MongoDB:

```bash
# Create MongoDB Atlas cluster at https://cloud.mongodb.com

# Get connection string
mongodb+srv://user:password@cluster.mongodb.net/netrunner?retryWrites=true&w=majority

# Update .env
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/netrunner?retryWrites=true&w=majority

# Remove MongoDB from docker-compose.yml
```

### 10. Monitoring & Logging

```bash
# View logs
docker-compose logs -f backend

# Monitor performance
watch docker stats

# Check uptime
curl -I https://netrunner.game/health
```

---

## Database Backup Strategy

### Automated Backups (MongoDB)

```bash
# Create backup script
cat > ~/backup-mongo.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backups/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup MongoDB
docker-compose exec -T mongo mongodump \
  --authenticationDatabase admin \
  --username admin \
  --password $(grep MONGO_PASSWORD .env | cut -d= -f2) \
  --out $BACKUP_DIR/backup_$DATE

# Upload to S3
aws s3 sync $BACKUP_DIR s3://netrunner-backups/ --delete

# Keep only last 7 days
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} \;
EOF

# Make executable
chmod +x ~/backup-mongo.sh

# Schedule with cron (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * ~/backup-mongo.sh") | crontab -
```

### DigitalOcean Spaces (S3-compatible storage)

```bash
# Create Spaces bucket
doctl compute spaces create netrunner-backups --region nyc3

# Install AWS CLI
sudo apt-get install -y awscli

# Configure credentials
aws configure

# Upload backup
aws s3 sync /backups/mongodb s3://netrunner-backups/ --endpoint-url https://nyc3.digitaloceanspaces.com
```

---

## Monitoring & Alerts

### Health Check Endpoint

```bash
# Check server health
curl https://api.netrunner.game/health

# Returns: 200 OK if healthy
```

### Uptime Monitoring

Use UptimeRobot or similar:
- Monitor: `https://api.netrunner.game/health`
- Interval: Every 5 minutes
- Alert on: 2 consecutive failures

### Log Aggregation

Using ELK Stack or similar:

```bash
# Export logs to CloudWatch
docker-compose exec backend npm install --save aws-sdk
# Then configure CloudWatch integration
```

---

## Scaling to Multiple Droplets

### Load Balancer Setup

1. Create Load Balancer in DigitalOcean
2. Point to 2-3 backend droplets
3. Configure health checks
4. Use MongoDB Atlas for shared database

```bash
# Create second droplet
doctl compute droplet create netrunner-backend-2 \
  --region nyc3 \
  --size s-2vcpu-4gb-intel \
  --image ubuntu-22-04-x64

# Point to same MongoDB Atlas
# Update MONGODB_URI in .env to Atlas connection string
```

---

## Cost Estimation

**Monthly costs (DigitalOcean):**
- App droplet (4GB): $20
- MongoDB Atlas (shared): $57
- Load Balancer: $10
- Backup storage: ~$5
- **Total: ~$92/month**

---

## Troubleshooting

### Cannot connect to MongoDB
```bash
# Check Docker logs
docker-compose logs mongo

# Verify credentials
docker-compose exec mongo mongosh -u admin -p $MONGO_PASSWORD

# Check firewall
sudo ufw status
```

### High memory usage
```bash
# Check container memory
docker stats

# Restart if needed
docker-compose restart backend

# Check for memory leaks
pm2 logs | grep "heap out of memory"
```

### SSL certificate issues
```bash
# Check expiration
openssl x509 -in ssl/cert.pem -text -noout | grep "Not After"

# Renew certificate
sudo certbot renew --force-renewal
```

---

## Production Checklist

- [ ] Set strong JWT_SECRET
- [ ] Set strong SESSION_SECRET  
- [ ] Configure MongoDB user/password
- [ ] Configure Redis password
- [ ] Set CORS_ORIGIN to your domain
- [ ] Enable SSL/TLS
- [ ] Configure firewall rules
- [ ] Set up automated backups
- [ ] Enable monitoring/alerts
- [ ] Create admin user account
- [ ] Test OAuth redirects
- [ ] Load test before launch
- [ ] Set up log aggregation
- [ ] Document deployment procedure
- [ ] Create runbook for incidents

---

## Next Steps

1. Test deployment on staging
2. Run load tests (see PERFORMANCE.md)
3. Deploy to production
4. Monitor for issues
5. Scale as needed

For questions, see README.md or submit an issue on GitHub.
