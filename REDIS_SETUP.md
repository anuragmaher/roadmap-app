# Redis Setup for Roadmap App

This application now uses Redis for server-side caching to improve performance.

## Local Development Setup

### Option 1: Install Redis Locally

**macOS (using Homebrew):**
```bash
brew install redis
brew services start redis
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis
sudo systemctl enable redis
```

**Windows:**
- Download Redis from https://github.com/microsoftarchive/redis/releases
- Or use Windows Subsystem for Linux (WSL)

### Option 2: Use Docker

```bash
# Run Redis in a Docker container
docker run -d --name redis-roadmap -p 6379:6379 redis:7-alpine

# Or use docker-compose (add to your docker-compose.yml):
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

volumes:
  redis_data:
```

## Environment Variables

Add to your `.env` file:

```env
# Redis Configuration
REDIS_URL=redis://localhost:6379

# For production with authentication:
# REDIS_URL=redis://username:password@hostname:port

# For Redis Cloud or other hosted services:
# REDIS_URL=rediss://username:password@hostname:port
```

## Production Deployment

### Recommended Redis Hosting Services:

1. **Redis Cloud** (managed service)
2. **AWS ElastiCache**
3. **Google Cloud Memorystore**
4. **DigitalOcean Managed Redis**
5. **Upstash** (serverless Redis)

### For Vercel Deployment:

1. Sign up for Redis Cloud or Upstash
2. Get your Redis URL
3. Add to Vercel environment variables:
   ```bash
   vercel env add REDIS_URL
   ```

## Cache Configuration

Current cache settings:
- **TTL (Time To Live)**: 5 minutes for home page data
- **Cache Keys**: `home_data:{tenantId}:{hostname}`
- **Auto Invalidation**: When roadmaps or items are created/updated/deleted

## Performance Benefits

With Redis caching enabled:
- ✅ ~90% faster response times on cached requests
- ✅ Reduced database load
- ✅ Better scalability
- ✅ Shared cache across multiple server instances
- ✅ Automatic cache invalidation on data changes

## Monitoring

Check Redis status:
```bash
# Connect to Redis CLI
redis-cli

# Check connected clients
redis-cli info clients

# Monitor cache hit/miss
redis-cli monitor
```

## Fallback Behavior

The application gracefully handles Redis unavailability:
- If Redis is down, requests go directly to the database
- No application errors if Redis is unavailable
- Cache operations are logged but don't block requests