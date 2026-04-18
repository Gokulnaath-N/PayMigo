# PayMigo Docker Deployment Guide

## Quick Start

### 1. Prerequisites
- Docker Desktop installed (Windows/Mac) or Docker + Docker Compose (Linux)
- Node.js 20+ and npm (for local development)
- Python 3.11+ (for ML services development)

### 2. Environment Setup

Copy the example environment file and update with your credentials:

```bash
cp .env.example .env
```

Edit `.env` and update these critical values:
- `DB_PASSWORD`: Strong database password
- `JWT_SECRET`: Secure random string
- `FIREBASE_*`: Your Firebase credentials
- `RAZORPAY_*`: Your Razorpay API keys

### 3. Build and Run Services

**Option A: Production Mode (Recommended)**
```bash
docker compose up -d --build
```

**Option B: Development Mode (With Hot Reload)**
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

### 4. Verify All Services are Running

```bash
docker compose ps
```

Expected output:
```
CONTAINER ID   IMAGE                  STATUS              PORTS
...            paymigo-postgres       Up (healthy)        5432
...            paymigo-backend        Up (healthy)        5000:5000
...            paymigo-frontend       Up (healthy)        3000:3000
...            paymigo-ml-service     Up (healthy)        8000:8000
```

### 5. Access Services

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **ML Service API**: http://localhost:8000
- **Backend Swagger Docs**: http://localhost:5000/docs (if configured)
- **ML Service Swagger Docs**: http://localhost:8000/docs
- **PostgreSQL**: localhost:5432 (from inside Docker network)

## Database Management

### Initialize Database with Prisma

```bash
# Run migrations (if inside container)
docker compose exec backend npx prisma migrate deploy

# Or from host (requires Node.js installed)
npx prisma migrate dev --name init
```

### Access Database

```bash
# Connect to PostgreSQL directly
docker compose exec postgres psql -U paymigo -d paymigo_db

# View data
SELECT * FROM "Worker" LIMIT 10;
EXIT;
```

### Backup Database

```bash
docker compose exec postgres pg_dump -U paymigo paymigo_db > backup.sql
```

### Restore Database

```bash
docker compose exec -T postgres psql -U paymigo paymigo_db < backup.sql
```

## Development Workflow

### Hot Reload (Local Development)

For faster iteration, run services locally with hot reload:

```bash
# Terminal 1: Backend
cd backend
npm install
npm run dev

# Terminal 2: Frontend
cd Paymigo_Frontend/web
npm install
npm run dev

# Terminal 3: ML Services
cd ml-services/ML-Service
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload

# Terminal 4: PostgreSQL (in Docker)
docker run --rm -d \
  -e POSTGRES_USER=paymigo \
  -e POSTGRES_PASSWORD=paymigo_secure_pwd_2024 \
  -e POSTGRES_DB=paymigo_db \
  -p 5432:5432 \
  --name paymigo-pg \
  postgres:16-alpine
```

### Local Testing with Docker Compose

```bash
# Build images without starting
docker compose build

# Start only database for local testing
docker compose up postgres

# Clean up
docker compose down
```

## Useful Docker Commands

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f ml-service
docker compose logs -f frontend

# Last 100 lines
docker compose logs --tail 100 backend
```

### Execute Commands in Container

```bash
# Run command in backend
docker compose exec backend npm run build

# Connect to database
docker compose exec postgres psql -U paymigo paymigo_db

# Run Python command in ML service
docker compose exec ml-service python -c "import app; print(app.__version__)"

# Interactive shell
docker compose exec backend /bin/sh
docker compose exec ml-service /bin/bash
```

### Rebuild Services

```bash
# Rebuild all
docker compose up -d --build

# Rebuild specific service
docker compose up -d --build backend
```

### Clean Up Resources

```bash
# Stop all services
docker compose down

# Stop and remove volumes (WARNING: deletes database data)
docker compose down -v

# Remove unused Docker resources
docker system prune -a

# Check disk usage
docker system df
```

## Production Deployment

### Before Deploying

1. **Update `.env` with production values:**
   - Strong passwords and keys
   - Real Firebase, Razorpay credentials
   - Production database credentials
   - Production domain for CORS

2. **Build optimized images:**
   ```bash
   docker compose build --no-cache
   ```

3. **Test locally:**
   ```bash
   docker compose up
   ```

### Deploy to Cloud

**Option 1: Docker Swarm**
```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml paymigo
```

**Option 2: AWS ECS**
- Push images to ECR
- Create ECS task definitions
- Deploy as service

**Option 3: Kubernetes**
- Convert compose to Kubernetes manifests using Kompose
- Or create manual K8s YAMLs

**Option 4: Railway / Render / Fly.io**
- Push GitHub repo
- Connect Docker Compose
- Auto-deploy on push

## Troubleshooting

### Service Won't Start

```bash
# Check logs
docker compose logs backend

# Common issues:
# 1. Port already in use
lsof -i :5000  # Find process on port 5000
kill -9 <PID>

# 2. Insufficient resources
docker stats  # Check memory usage

# 3. Restart service
docker compose restart backend
```

### Database Connection Failed

```bash
# Check if postgres is healthy
docker compose ps

# Wait for postgres (may take 30+ seconds)
docker compose logs postgres

# Reset database
docker compose down -v
docker compose up postgres
```

### Frontend Can't Connect to Backend

```bash
# Check service connectivity from inside container
docker compose exec frontend wget http://backend:5000/health

# Check CORS settings in backend
# Verify CORS_ORIGIN environment variable
docker compose exec backend echo $CORS_ORIGIN
```

### Build Fails

```bash
# Clear Docker cache and rebuild
docker system prune -a
docker compose build --no-cache

# Check specific layer
docker compose build --progress=plain backend
```

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DB_USER` | Yes | paymigo | Database username |
| `DB_PASSWORD` | Yes | paymigo_secure_pwd_2024 | Database password |
| `DB_NAME` | Yes | paymigo_db | Database name |
| `NODE_ENV` | No | production | Node.js environment |
| `PORT` | No | 5000 | Backend port |
| `CORS_ORIGIN` | No | http://localhost:3000 | CORS allowed origin |
| `JWT_SECRET` | Yes | - | JWT signing secret |
| `FIREBASE_PROJECT_ID` | Yes | - | Firebase project ID |
| `FIREBASE_PRIVATE_KEY` | Yes | - | Firebase private key |
| `FIREBASE_CLIENT_EMAIL` | Yes | - | Firebase client email |
| `RAZORPAY_KEY_ID` | Yes | - | Razorpay public key |
| `RAZORPAY_KEY_SECRET` | Yes | - | Razorpay secret key |
| `ML_SERVICE_URL` | No | http://ml-service:8000 | ML service endpoint |
| `VITE_API_URL` | No | http://localhost:5000 | Frontend API endpoint |
| `VITE_ML_SERVICE_URL` | No | http://localhost:8000 | Frontend ML endpoint |

## Performance Optimization

### Memory Management
```bash
# Set memory limits in docker-compose.yml
deploy:
  resources:
    limits:
      memory: 512M
    reservations:
      memory: 256M
```

### Caching
- Frontend: Nginx caches static assets (1 year)
- Backend: Add Redis cache layer if needed
- Build: Docker uses layer caching

### Database
- Add indexes to frequently queried columns
- Monitor slow queries: `docker compose logs postgres | grep slow`

## Security Best Practices

1. **Never commit `.env` file** — it contains secrets
2. **Use strong passwords** — minimum 16 characters
3. **Enable authentication** — require JWT tokens
4. **Limit exposed ports** — only expose 80, 443 in production
5. **Keep images updated** — rebuild weekly with `--no-cache`
6. **Scan images** — use `docker scout cves`
7. **Use secrets management** — Docker secrets or external vault

## Next Steps

1. Complete `.env` with real credentials
2. Test locally: `docker compose up`
3. Run database migrations: `docker compose exec backend npx prisma migrate deploy`
4. Verify all endpoints are accessible
5. Deploy to production environment

For issues or questions, check Docker and service documentation:
- Docker: https://docs.docker.com
- Express: https://expressjs.com
- FastAPI: https://fastapi.tiangolo.com
- Prisma: https://www.prisma.io/docs
- PostgreSQL: https://www.postgresql.org/docs
