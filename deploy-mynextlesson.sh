#!/bin/bash

# MyNextLesson.com Deployment Script
# Comprehensive deployment for production-ready learning platform

set -e

echo "🚀 Starting MyNextLesson.com deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="mynextlesson.com"
PROJECT_NAME="mynextlesson"
REGION="us-east-1"

# Check prerequisites
echo -e "${BLUE}📋 Checking prerequisites...${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+ first.${NC}"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed. Please install npm first.${NC}"
    exit 1
fi

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ git is not installed. Please install git first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# Install dependencies
echo -e "${BLUE}📦 Installing dependencies...${NC}"
npm install

# Build the application
echo -e "${BLUE}🔨 Building application...${NC}"
npm run build

# Environment setup
echo -e "${BLUE}⚙️ Setting up environment...${NC}"

# Create production environment file
cat > .env.production << EOF
# MyNextLesson.com Production Environment

# API Keys
ELEVENLABS_API_KEY=${ELEVENLABS_API_KEY}
HEYGEN_API_KEY=${HEYGEN_API_KEY}
DESCRIPT_API_TOKEN=${DESCRIPT_API_TOKEN}

# Avatar Configuration
KELLY_AVATAR_ID=80d67b1371b342ecaf4235e5f61491ae
KELLY_VOICE_ID=cJLh37pTYdhJT0Dvnttb
KEN_AVATAR_ID=ae16c1eb9ff44e7b8a7ca21c4cc0de02
KEN_VOICE_ID=s6JeSRcsXa6EBsc5ODOx

# Cloudflare Configuration
CLOUDFLARE_API_TOKEN=${CLOUDFLARE_API_TOKEN}
CLOUDFLARE_ACCOUNT_ID=${CLOUDFLARE_ACCOUNT_ID}
R2_ACCESS_KEY_ID=${R2_ACCESS_KEY_ID}
R2_SECRET_ACCESS_KEY=${R2_SECRET_ACCESS_KEY}
R2_BUCKET_NAME=mynextlesson-assets

# Database Configuration
DATABASE_URL=${DATABASE_URL}
REDIS_URL=${REDIS_URL}

# Analytics
GOOGLE_ANALYTICS_ID=${GOOGLE_ANALYTICS_ID}
MIXPANEL_TOKEN=${MIXPANEL_TOKEN}

# Security
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
NEXTAUTH_URL=https://${DOMAIN}

# Performance
NEXT_PUBLIC_API_URL=https://api.${DOMAIN}
CDN_URL=https://cdn.${DOMAIN}
CACHE_DURATION=3600

# Rate Limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=60000
MAX_CONCURRENT_SESSIONS=1000

# Monitoring
SENTRY_DSN=${SENTRY_DSN}
LOG_LEVEL=info
EOF

echo -e "${GREEN}✅ Environment file created${NC}"

# Create Cloudflare configuration
echo -e "${BLUE}☁️ Setting up Cloudflare configuration...${NC}"

cat > wrangler.toml << EOF
name = "${PROJECT_NAME}"
main = "api/index.ts"
compatibility_date = "2024-01-01"

[env.production]
name = "${PROJECT_NAME}-prod"
route = "${DOMAIN}/*"
zone_id = "${CLOUDFLARE_ZONE_ID}"

[env.staging]
name = "${PROJECT_NAME}-staging"
route = "staging.${DOMAIN}/*"
zone_id = "${CLOUDFLARE_ZONE_ID}"

[[env.production.kv_namespaces]]
binding = "LESSONS"
id = "${CLOUDFLARE_KV_ID}"
preview_id = "${CLOUDFLARE_KV_PREVIEW_ID}"

[[env.production.r2_buckets]]
binding = "ASSETS"
bucket_name = "mynextlesson-assets"

[env.production.vars]
ENVIRONMENT = "production"
DOMAIN = "${DOMAIN}"

[env.staging.vars]
ENVIRONMENT = "staging"
DOMAIN = "staging.${DOMAIN}"
EOF

echo -e "${GREEN}✅ Cloudflare configuration created${NC}"

# Create Next.js configuration
echo -e "${BLUE}⚙️ Setting up Next.js configuration...${NC}"

cat > next.config.js << EOF
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Image optimization
  images: {
    domains: [
      'cdn.${DOMAIN}',
      'videos.${DOMAIN}',
      'avatars.${DOMAIN}',
      'api.heygen.com',
      'api.elevenlabs.io'
    ],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Audio/Video optimization
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react'],
  },
  
  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, s-maxage=600',
          },
        ],
      },
    ];
  },
  
  // Redirects
  async redirects() {
    return [
      {
        source: '/',
        destination: '/mynextlesson',
        permanent: false,
      },
    ];
  },
  
  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Webpack configuration for audio/video
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    // Audio/Video file handling
    config.module.rules.push({
      test: /\\.(mp3|wav|ogg|mp4|webm)$/,
      use: {
        loader: 'file-loader',
        options: {
          publicPath: '/_next/static/media/',
          outputPath: 'static/media/',
        },
      },
    });
    
    return config;
  },
};

module.exports = nextConfig;
EOF

echo -e "${GREEN}✅ Next.js configuration created${NC}"

# Create Docker configuration
echo -e "${BLUE}🐳 Setting up Docker configuration...${NC}"

cat > Dockerfile << EOF
# Multi-stage build for production
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
EOF

cat > docker-compose.yml << EOF
version: '3.8'

services:
  mynextlesson:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    volumes:
      - ./logs:/app/logs
      - ./uploads:/app/uploads

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped
    command: redis-server --appendonly yes

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - mynextlesson
    restart: unless-stopped

volumes:
  redis_data:
EOF

echo -e "${GREEN}✅ Docker configuration created${NC}"

# Create Nginx configuration
echo -e "${BLUE}🌐 Setting up Nginx configuration...${NC}"

cat > nginx.conf << EOF
events {
    worker_connections 1024;
}

http {
    upstream mynextlesson {
        server mynextlesson:3000;
    }

    # Rate limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone \$binary_remote_addr zone=avatar:10m rate=5r/s;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    server {
        listen 80;
        server_name ${DOMAIN} www.${DOMAIN};
        return 301 https://\$server_name\$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name ${DOMAIN} www.${DOMAIN};

        ssl_certificate /etc/nginx/ssl/${DOMAIN}.crt;
        ssl_certificate_key /etc/nginx/ssl/${DOMAIN}.key;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;

        # Security headers
        add_header Strict-Transport-Security "max-age=63072000" always;

        # Root location
        location / {
            proxy_pass http://mynextlesson;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_cache_bypass \$http_upgrade;
        }

        # API rate limiting
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://mynextlesson;
            proxy_http_version 1.1;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }

        # Avatar API special rate limiting
        location /api/avatar/ {
            limit_req zone=avatar burst=10 nodelay;
            proxy_pass http://mynextlesson;
            proxy_http_version 1.1;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_read_timeout 300s;
            proxy_connect_timeout 75s;
        }

        # Static assets caching
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            proxy_pass http://mynextlesson;
        }

        # Audio/Video streaming
        location ~* \.(mp3|wav|ogg|mp4|webm)$ {
            proxy_pass http://mynextlesson;
            proxy_http_version 1.1;
            proxy_set_header Range \$http_range;
            proxy_set_header If-Range \$http_if_range;
            proxy_cache_valid 200 1h;
            add_header Accept-Ranges bytes;
        }

        # Health check
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
EOF

echo -e "${GREEN}✅ Nginx configuration created${NC}"

# Create deployment scripts
echo -e "${BLUE}📜 Creating deployment scripts...${NC}"

cat > scripts/deploy-staging.sh << EOF
#!/bin/bash
echo "🚀 Deploying to staging..."
wrangler deploy --env staging
echo "✅ Staging deployment complete"
EOF

cat > scripts/deploy-production.sh << EOF
#!/bin/bash
echo "🚀 Deploying to production..."
wrangler deploy --env production
echo "✅ Production deployment complete"
EOF

cat > scripts/backup-database.sh << EOF
#!/bin/bash
echo "💾 Creating database backup..."
DATE=\$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_\${DATE}.sql"

# Add your database backup logic here
echo "✅ Backup created: \${BACKUP_FILE}"
EOF

chmod +x scripts/deploy-staging.sh
chmod +x scripts/deploy-production.sh
chmod +x scripts/backup-database.sh

echo -e "${GREEN}✅ Deployment scripts created${NC}"

# Create monitoring configuration
echo -e "${BLUE}📊 Setting up monitoring...${NC}"

cat > monitoring/health-check.js << EOF
const https = require('https');

const endpoints = [
  'https://${DOMAIN}/api/health',
  'https://${DOMAIN}/api/daily-lesson?day=1',
  'https://staging.${DOMAIN}/api/health'
];

async function checkHealth(endpoint) {
  return new Promise((resolve) => {
    https.get(endpoint, (res) => {
      resolve({
        endpoint,
        status: res.statusCode,
        healthy: res.statusCode === 200
      });
    }).on('error', (err) => {
      resolve({
        endpoint,
        status: 'ERROR',
        healthy: false,
        error: err.message
      });
    });
  });
}

async function runHealthChecks() {
  console.log('🏥 Running health checks...');
  
  const results = await Promise.all(
    endpoints.map(endpoint => checkHealth(endpoint))
  );
  
  results.forEach(result => {
    const status = result.healthy ? '✅' : '❌';
    console.log(\`\${status} \${result.endpoint} - \${result.status}\`);
  });
  
  const allHealthy = results.every(r => r.healthy);
  if (!allHealthy) {
    process.exit(1);
  }
}

runHealthChecks();
EOF

echo -e "${GREEN}✅ Monitoring configuration created${NC}"

# Create SSL certificate setup
echo -e "${BLUE}🔒 Setting up SSL certificates...${NC}"

mkdir -p ssl
cat > ssl/README.md << EOF
# SSL Certificates for ${DOMAIN}

Place your SSL certificates here:
- ${DOMAIN}.crt (Certificate)
- ${DOMAIN}.key (Private Key)

You can obtain certificates from:
1. Let's Encrypt (free)
2. Your domain registrar
3. A certificate authority

For Let's Encrypt, run:
\`\`\`bash
certbot certonly --standalone -d ${DOMAIN} -d www.${DOMAIN}
\`\`\`
EOF

echo -e "${GREEN}✅ SSL setup created${NC}"

# Create CI/CD pipeline
echo -e "${BLUE}🔄 Setting up CI/CD pipeline...${NC}"

cat > .github/workflows/deploy.yml << EOF
name: Deploy MyNextLesson

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Build application
      run: npm run build

  deploy-staging:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build application
      run: npm run build
    
    - name: Deploy to Cloudflare (Staging)
      uses: cloudflare/wrangler-action@v3
      with:
        apiToken: \${{ secrets.CLOUDFLARE_API_TOKEN }}
        accountId: \${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
        command: deploy --env staging

  deploy-production:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build application
      run: npm run build
    
    - name: Deploy to Cloudflare (Production)
      uses: cloudflare/wrangler-action@v3
      with:
        apiToken: \${{ secrets.CLOUDFLARE_API_TOKEN }}
        accountId: \${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
        command: deploy --env production
EOF

echo -e "${GREEN}✅ CI/CD pipeline created${NC}"

# Create documentation
echo -e "${BLUE}📚 Creating documentation...${NC}"

cat > DEPLOYMENT.md << EOF
# MyNextLesson.com Deployment Guide

## Overview
This document describes how to deploy MyNextLesson.com to production.

## Prerequisites
- Node.js 18+
- npm
- Git
- Cloudflare account
- Domain (${DOMAIN})

## Environment Variables
Set the following environment variables:

\`\`\`bash
# API Keys
ELEVENLABS_API_KEY=your_elevenlabs_key
HEYGEN_API_KEY=your_heygen_key
DESCRIPT_API_TOKEN=your_descript_token

# Cloudflare
CLOUDFLARE_API_TOKEN=your_cloudflare_token
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_ZONE_ID=your_zone_id
CLOUDFLARE_KV_ID=your_kv_id
CLOUDFLARE_KV_PREVIEW_ID=your_kv_preview_id

# Storage
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key

# Database
DATABASE_URL=your_database_url
REDIS_URL=your_redis_url

# Security
NEXTAUTH_SECRET=your_nextauth_secret

# Analytics
GOOGLE_ANALYTICS_ID=your_ga_id
MIXPANEL_TOKEN=your_mixpanel_token
SENTRY_DSN=your_sentry_dsn
\`\`\`

## Deployment Options

### Option 1: Cloudflare Pages (Recommended)
\`\`\`bash
# Deploy to staging
./scripts/deploy-staging.sh

# Deploy to production
./scripts/deploy-production.sh
\`\`\`

### Option 2: Docker
\`\`\`bash
# Build and run with Docker Compose
docker-compose up -d

# Or build and run individual containers
docker build -t mynextlesson .
docker run -p 3000:3000 mynextlesson
\`\`\`

### Option 3: VPS/Server
\`\`\`bash
# Install dependencies
npm install

# Build application
npm run build

# Start production server
npm start
\`\`\`

## Monitoring
- Health checks: https://${DOMAIN}/health
- Monitoring script: node monitoring/health-check.js

## SSL Certificates
Place SSL certificates in the \`ssl/\` directory:
- ${DOMAIN}.crt
- ${DOMAIN}.key

## Backup
Run database backups regularly:
\`\`\`bash
./scripts/backup-database.sh
\`\`\`

## Troubleshooting
1. Check logs: \`docker-compose logs mynextlesson\`
2. Health check: \`curl https://${DOMAIN}/health\`
3. Monitor resources: \`docker stats\`
EOF

echo -e "${GREEN}✅ Documentation created${NC}"

# Final setup
echo -e "${BLUE}🎯 Final setup...${NC}"

# Make deployment script executable
chmod +x deploy-mynextlesson.sh

# Create .gitignore additions
echo -e "${BLUE}📝 Updating .gitignore...${NC}"

cat >> .gitignore << EOF

# Production files
.env.production
.env.local
.env.staging

# SSL certificates
ssl/*.crt
ssl/*.key

# Logs
logs/
*.log

# Uploads
uploads/

# Build artifacts
.next/
out/
dist/

# Docker
.dockerignore

# Monitoring
monitoring/logs/
EOF

echo -e "${GREEN}✅ .gitignore updated${NC}"

# Summary
echo -e "${GREEN}🎉 MyNextLesson.com deployment setup complete!${NC}"
echo ""
echo -e "${YELLOW}📋 Next steps:${NC}"
echo "1. Set up environment variables in .env.production"
echo "2. Configure Cloudflare DNS for ${DOMAIN}"
echo "3. Set up SSL certificates in ssl/ directory"
echo "4. Deploy to staging: ./scripts/deploy-staging.sh"
echo "5. Deploy to production: ./scripts/deploy-production.sh"
echo ""
echo -e "${BLUE}📚 Documentation:${NC}"
echo "- Deployment guide: DEPLOYMENT.md"
echo "- API documentation: /api/docs"
echo "- Monitoring: monitoring/health-check.js"
echo ""
echo -e "${GREEN}🚀 Ready to deploy MyNextLesson.com!${NC}" 