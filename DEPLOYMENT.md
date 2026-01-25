# ==========================================

# DEPLOYMENT GUIDE

# ==========================================

# Production Deployment Guide

## Overview

This guide covers deploying the Low Noise newsletter application to production environments including Vercel, Docker, and traditional VPS hosting.

## Prerequisites

- Node.js 18+ installed
- Firebase project configured
- Environment variables ready
- Domain name (optional but recommended)

---

## Deployment Option 1: Vercel (Recommended)

### Why Vercel?

- Zero-configuration deployment
- Automatic HTTPS
- Global CDN
- Serverless functions
- Automatic scaling

### Steps

1. **Install Vercel CLI**

   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**

   ```bash
   vercel login
   ```

3. **Deploy**

   ```bash
   # From project root
   vercel

   # Or for production
   vercel --prod
   ```

4. **Configure Environment Variables**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add all variables from `.env.example`
   - Ensure to add them for all environments (Production, Preview, Development)

5. **Configure Build Settings**
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

### Custom Domain

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed
4. Wait for SSL certificate provisioning (automatic)

---

## Deployment Option 2: Docker

### Build Docker Image

```bash
# Build the image
docker build -t newsletter:latest .

# Tag for registry (if pushing to Docker Hub or ECR)
docker tag newsletter:latest your-registry/newsletter:latest

# Push to registry
docker push your-registry/newsletter:latest
```

### Run with Docker

```bash
# Run container
docker run -d \
  --name newsletter \
  -p 3000:3000 \
  --env-file .env.local \
  --restart unless-stopped \
  newsletter:latest

# Check logs
docker logs -f newsletter

# Stop container
docker stop newsletter

# Remove container
docker rm newsletter
```

### Run with Docker Compose

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild and restart
docker-compose up -d --build
```

---

## Deployment Option 3: VPS (Ubuntu/Debian)

### Server Requirements

- Ubuntu 22.04 LTS or Debian 11+
- 2GB RAM minimum (4GB recommended)
- 20GB disk space
- Node.js 18+
- Nginx
- PM2 process manager

### Installation Steps

1. **Update System**

   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Install Node.js**

   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs
   ```

3. **Install PM2**

   ```bash
   sudo npm install -g pm2
   ```

4. **Clone Repository**

   ```bash
   git clone your-repo-url
   cd newsletter
   ```

5. **Install Dependencies**

   ```bash
   npm ci --production
   ```

6. **Create Environment File**

   ```bash
   cp .env.example .env.local
   nano .env.local  # Add your variables
   ```

7. **Build Application**

   ```bash
   npm run build
   ```

8. **Start with PM2**

   ```bash
   pm2 start npm --name "newsletter" -- start
   pm2 save
   pm2 startup  # Follow instructions to enable auto-start
   ```

9. **Configure Nginx**

   ```bash
   sudo nano /etc/nginx/sites-available/newsletter
   ```

   Add configuration:

   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

10. **Enable Site**

    ```bash
    sudo ln -s /etc/nginx/sites-available/newsletter /etc/nginx/sites-enabled/
    sudo nginx -t
    sudo systemctl restart nginx
    ```

11. **Setup SSL with Let's Encrypt**
    ```bash
    sudo apt install certbot python3-certbot-nginx
    sudo certbot --nginx -d your-domain.com
    sudo systemctl reload nginx
    ```

---

## Deployment Option 4: AWS (EC2 + ECS)

### EC2 Deployment

1. Launch EC2 instance (t3.small or larger)
2. Follow VPS deployment steps above
3. Configure security groups to allow HTTP/HTTPS
4. Use Elastic IP for static IP address

### ECS Deployment

1. **Push Docker Image to ECR**

   ```bash
   aws ecr create-repository --repository-name newsletter
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin your-account-id.dkr.ecr.us-east-1.amazonaws.com
   docker tag newsletter:latest your-account-id.dkr.ecr.us-east-1.amazonaws.com/newsletter:latest
   docker push your-account-id.dkr.ecr.us-east-1.amazonaws.com/newsletter:latest
   ```

2. **Create ECS Task Definition**
3. **Create ECS Service**
4. **Configure ALB (Application Load Balancer)**
5. **Setup Auto Scaling**

---

## Environment Variables

### Required Variables

```env
# Firebase Admin (Server-side)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Firebase Client (Browser)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id

# Application
NEXT_PUBLIC_BASE_URL=https://your-domain.com
NODE_ENV=production

# Email (NodeMailer)
GMAIL_HOST=smtp.gmail.com
GMAIL_USER=your-email@gmail.com
GMAIL_PASSWORD=your-app-password

# R2/S3 Storage
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=your-bucket-name
```

---

## Post-Deployment Checklist

- [ ] All environment variables are set correctly
- [ ] Firebase authentication providers are configured
- [ ] Firestore security rules are in production mode
- [ ] Custom domain is configured and SSL is active
- [ ] Error tracking is configured (e.g., Sentry)
- [ ] Analytics are set up (e.g., Google Analytics)
- [ ] Backup strategy is in place
- [ ] Monitoring is configured
- [ ] Health check endpoint is accessible (`/api/health`)
- [ ] Rate limiting is working
- [ ] Email sending is working
- [ ] Image uploads are working

---

## Monitoring

### Health Check

```bash
curl https://your-domain.com/api/health
```

Expected response:

```json
{
  "status": "healthy",
  "timestamp": "2026-01-26T...",
  "checks": {
    "server": true,
    "firebase": true
  },
  "uptime": 12345.67,
  "memory": {...}
}
```

### PM2 Monitoring

```bash
# View status
pm2 status

# View logs
pm2 logs newsletter

# Monitor resources
pm2 monit

# Restart application
pm2 restart newsletter
```

---

## Troubleshooting

### Application Won't Start

1. Check environment variables
2. Verify Node.js version (18+)
3. Check build logs: `npm run build`
4. Verify Firebase credentials

### High Memory Usage

1. Restart application: `pm2 restart newsletter`
2. Check for memory leaks in logs
3. Consider increasing server resources
4. Enable caching to reduce database calls

### Slow Performance

1. Enable caching
2. Optimize images
3. Check database query performance
4. Enable CDN for static assets
5. Consider horizontal scaling

---

## Scaling Strategy

### Horizontal Scaling

1. Deploy multiple instances behind a load balancer
2. Use Redis for session storage (shared sessions)
3. Use cloud-based caching (CloudFlare, AWS CloudFront)
4. Implement database read replicas

### Vertical Scaling

1. Increase server resources (CPU, RAM)
2. Optimize database queries
3. Implement caching aggressively
4. Use CDN for static assets

---

## Backup Strategy

### Database Backups

Firebase Firestore has automatic backups, but consider:

- Daily exports to Cloud Storage
- Point-in-time recovery configuration
- Regular backup testing

### Application Backups

- Git repository (code)
- Environment variables (secure storage)
- User-uploaded files (R2/S3 versioning)

---

## Security Hardening

1. **Enable Firewall**

   ```bash
   sudo ufw allow 22
   sudo ufw allow 80
   sudo ufw allow 443
   sudo ufw enable
   ```

2. **Disable Root Login**

   ```bash
   sudo nano /etc/ssh/sshd_config
   # Set: PermitRootLogin no
   sudo systemctl restart sshd
   ```

3. **Setup Fail2Ban**

   ```bash
   sudo apt install fail2ban
   sudo systemctl enable fail2ban
   ```

4. **Regular Updates**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

---

## Rollback Strategy

### Vercel

- Go to Deployments → Select previous deployment → Promote to Production

### Docker

```bash
docker pull your-registry/newsletter:previous-tag
docker-compose down
docker-compose up -d
```

### PM2

```bash
git checkout previous-commit
npm run build
pm2 restart newsletter
```

---

## Support

For deployment issues:

- Check application logs
- Review Firebase Console
- Verify environment variables
- Test health check endpoint
- Contact support team

---

**Last Updated**: January 2026
