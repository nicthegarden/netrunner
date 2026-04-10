# 📖 NETRUNNER Production Deployment Runbook

**Version:** 1.0  
**Last Updated:** April 10, 2026  
**Status:** Ready for Production

---

## 🚀 Quick Start: Deploy in 5 Minutes

### Prerequisites
```bash
# Verify you have:
- Docker installed (docker --version)
- Docker Compose installed (docker-compose --version)
- Git access to netrunner repository
- GitHub account with access to secrets
```

### Deploy Locally (Dev/Staging)
```bash
# 1. Clone repository
git clone https://github.com/nicthegarden/netrunner.git
cd netrunner

# 2. Copy environment file
cp .env.example .env
# Edit .env with your configuration

# 3. Build and start containers
docker-compose up -d

# 4. Verify services are running
docker-compose ps
# Expected: All services showing "healthy"

# 5. Test the game
open http://localhost:8000

# 6. View logs
docker-compose logs -f frontend
docker-compose logs -f backend
```

### Rollback
```bash
# Stop current deployment
docker-compose down

# Start previous version
docker-compose pull
docker-compose up -d
```

---

## 🏗️ Setup: First Time Deployment

### Step 1: Prepare Environment

```bash
# 1. Create DigitalOcean droplet
# 2. SSH into droplet
ssh root@your_droplet_ip

# 3. Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 4. Clone repository
mkdir -p /opt/netrunner
cd /opt/netrunner
git clone https://github.com/nicthegarden/netrunner.git .
```

### Step 2: Configure Secrets

```bash
# Create .env from template
cp .env.example .env
nano .env

# Essential variables to set:
# - DATABASE_URL (PostgreSQL connection string)
# - JWT_SECRET (generate with: openssl rand -base64 32)
# - CORS_ORIGIN (https://yourdomain.com)
# - SENTRY_DSN (error tracking)
```

### Step 3: Setup GitHub Actions Secrets

Go to GitHub repository Settings → Secrets and variables → Actions

Add these secrets:
```
DOCKER_USERNAME     → your_docker_username
DOCKER_PASSWORD     → your_docker_password
DO_TOKEN            → your_digitalocean_token
DROPLET_IP          → your_droplet_ip_address
SLACK_WEBHOOK       → your_slack_webhook_url (optional)
```

### Step 4: Configure DNS

```bash
# Point your domain to the droplet IP
# In your domain registrar:
# A record: netrunner.game → your_droplet_ip
# A record: api.netrunner.game → your_droplet_ip

# Verify DNS is working
nslookup netrunner.game
```

### Step 5: Setup SSL Certificates

```bash
# Using Let's Encrypt (automatic via certbot)
sudo apt update
sudo apt install -y certbot python3-certbot-nginx

# Generate certificate
sudo certbot certonly --standalone -d netrunner.game -d api.netrunner.game

# Certificates will be in:
# /etc/letsencrypt/live/netrunner.game/
```

---

## 🔄 Regular Deployments (Using GitHub Actions)

### Automatic Deployment
```
1. Push code to main branch
2. GitHub Actions workflow triggers automatically
3. Tests run and Docker images build
4. Deployment to production happens automatically
5. Health checks verify deployment succeeded
6. Slack notification sent (if configured)
```

### View Deployment Status
```
GitHub → Actions tab → Latest workflow run
Look for:
- ✅ test job
- ✅ build job
- ✅ deploy job
```

### Monitor Production
```bash
# SSH into droplet
ssh root@your_droplet_ip

# Check running containers
docker ps

# View logs
docker logs netrunner-frontend
docker logs netrunner-backend

# Check health status
curl http://localhost:8000
curl http://localhost:3000/api/health
```

---

## 🛠️ Common Operations

### Check Status
```bash
# Login to droplet
ssh root@your_droplet_ip

# Check containers
docker ps

# Check logs for errors
docker logs --tail 100 netrunner-backend

# Check resource usage
docker stats

# Check database
docker exec netrunner-postgres psql -U netrunner -d netrunner -c "SELECT COUNT(*) FROM players;"
```

### Update Game Code
```bash
# Automatic via GitHub Actions when you push to main
git push origin main

# Or manually on droplet:
cd /opt/netrunner
git pull origin main
docker-compose down
docker-compose up -d
```

### Restart Services
```bash
# Graceful restart
docker-compose restart

# Hard restart
docker-compose down
docker-compose up -d

# Restart specific service
docker-compose restart frontend
docker-compose restart backend
```

### View Real-Time Logs
```bash
# Frontend logs
docker logs -f netrunner-frontend

# Backend logs with 100 lines
docker logs -f --tail 100 netrunner-backend

# Both services
docker-compose logs -f
```

### Scale Services (when needed)
```bash
# Edit docker-compose.yml to add more backend instances
# Or use Docker Swarm / Kubernetes for advanced scaling
```

---

## 🆘 Troubleshooting

### Issue: "Connection refused"
```bash
# Check if services are running
docker ps

# Check if ports are listening
netstat -tlnp | grep 8000
netstat -tlnp | grep 3000

# View service logs
docker logs netrunner-frontend
docker logs netrunner-backend
```

### Issue: "Health check failed"
```bash
# Wait a few seconds (startup time)
sleep 10
docker ps

# Check health status
docker inspect netrunner-frontend | grep -A 5 Health

# Restart if stuck
docker-compose restart frontend backend
```

### Issue: "Database connection failed"
```bash
# Verify database is running
docker ps | grep postgres

# Check database logs
docker logs netrunner-postgres

# Verify DATABASE_URL in .env is correct
cat .env | grep DATABASE_URL

# Test connection manually
docker exec netrunner-postgres psql -U netrunner -d netrunner -c "SELECT 1;"
```

### Issue: "Out of memory"
```bash
# Check resource usage
docker stats

# Increase resources or restart
docker-compose down
docker-compose up -d

# Or add resource limits to docker-compose.yml:
# services:
#   backend:
#     deploy:
#       resources:
#         limits:
#           memory: 512M
```

### Issue: "Game stuck loading"
```bash
# Check frontend logs
docker logs netrunner-frontend

# Check if backend is responding
curl http://localhost:3000/api/health

# Restart both services
docker-compose restart

# Or full reset
docker-compose down
docker-compose up -d
```

---

## 📊 Monitoring

### Health Checks
```bash
# Frontend is healthy if:
curl http://localhost:8000
# Returns HTTP 200 with HTML content

# Backend is healthy if:
curl http://localhost:3000/api/health
# Returns JSON: { "status": "ok", "timestamp": "..." }
```

### Monitor Error Rate
```bash
# Check Sentry dashboard (if configured)
# URL: https://sentry.io/your-project

# Or in logs:
docker logs netrunner-backend | grep ERROR
```

### Monitor Performance
```bash
# Check response times
curl -w "Time: %{time_total}s\n" http://localhost:3000/api/health

# Check database performance
docker exec netrunner-postgres psql -U netrunner -d netrunner -c "\dt+"

# Monitor WebSocket connections (in app logs)
docker logs netrunner-backend | grep "connected\|disconnected"
```

### Uptime Monitoring
```bash
# Setup external monitoring (e.g., UptimeRobot)
# Check endpoint: http://your_domain/api/health
# Alert if down for >5 minutes
```

---

## 🔄 Rollback Procedure

If something goes wrong after deployment:

```bash
# Option 1: Rollback via Docker images
ssh root@your_droplet_ip
cd /opt/netrunner

# Stop current version
docker-compose down

# Switch to previous image tag
docker pull previous_image_tag
docker tag previous_image_tag current_tag

# Restart
docker-compose up -d

# Option 2: Rollback via Git
cd /opt/netrunner
git reset --hard HEAD~1
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Option 3: Quick restart if issue is temporary
docker-compose restart
```

---

## 📝 Deployment Checklist

Before deploying to production:

- [ ] All tests passing locally
- [ ] Code reviewed and approved
- [ ] .env configured correctly
- [ ] Database backed up
- [ ] SSL certificates valid
- [ ] DNS configured
- [ ] Monitoring configured
- [ ] Alerting configured
- [ ] Runbook reviewed
- [ ] Rollback plan ready

After deploying to production:

- [ ] Health checks passing
- [ ] No errors in logs
- [ ] Frontend loading correctly
- [ ] Backend API responding
- [ ] WebSocket connections working
- [ ] Database accessible
- [ ] Error tracking working
- [ ] Performance within baseline
- [ ] Monitoring alerts working
- [ ] Team notified of deployment

---

## 🚨 Emergency Contacts

```
Production Support:
- Slack: #netrunner-prod
- Email: ops@netrunner.game
- On-call: See rotation schedule

Incident Response:
1. Declare incident in #incident channel
2. Start bridge call
3. Gather logs and metrics
4. Implement fix or rollback
5. Post mortem within 24 hours
```

---

## 📞 Support

For deployment issues:
- Check this runbook first (troubleshooting section)
- Check logs: `docker logs netrunner-backend`
- Check Sentry dashboard
- Check GitHub Actions logs
- Contact DevOps team

---

**Document Status:** ✅ Ready for Production  
**Last Updated:** April 10, 2026  
**Next Review:** When major changes are made

