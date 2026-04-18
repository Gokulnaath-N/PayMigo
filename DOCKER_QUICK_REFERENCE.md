# PayMigo Docker Quick Reference

## Start Everything
```bash
# Production (optimized, detached)
docker compose up -d --build

# Development (with hot reload)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up

# Specific service only
docker compose up -d postgres
docker compose up backend
```

## Stop Everything
```bash
docker compose down          # Stop services, keep volumes
docker compose down -v       # Stop services, delete volumes & data
docker compose stop          # Stop without removing containers
```

## View Logs
```bash
docker compose logs -f              # All services
docker compose logs -f backend      # Specific service
docker compose logs backend | tail  # Last 100 lines
```

## Execute Commands
```bash
docker compose exec backend npm run build        # Backend command
docker compose exec postgres psql -U paymigo -d paymigo_db  # DB shell
docker compose exec ml-service python script.py # ML command
docker compose exec frontend /bin/sh             # Frontend shell
```

## Database
```bash
# Run migrations
docker compose exec backend npx prisma migrate deploy

# View database
docker compose exec postgres psql -U paymigo paymigo_db
SELECT * FROM "Worker" LIMIT 5;

# Backup
docker compose exec postgres pg_dump -U paymigo paymigo_db > backup.sql

# Restore
docker compose exec -T postgres psql -U paymigo paymigo_db < backup.sql
```

## Service Health
```bash
docker compose ps                    # Status of all services
docker stats                         # CPU/Memory usage
docker compose exec backend wget http://backend:5000/health  # Check health
```

## Rebuild & Clean
```bash
docker compose build --no-cache      # Full rebuild
docker compose pull                  # Pull latest images
docker system prune -a               # Clean unused resources
docker volume ls && docker volume rm # Manage volumes
```

## Debug
```bash
docker compose logs backend          # View errors
docker compose config               # Validate compose file
docker compose events               # Watch events in real-time
docker compose exec service /bin/sh  # Interactive shell
```

## Environment
```bash
cp .env.example .env                 # Create .env file
docker compose config --resolve-image-digests  # View with env vars
```

## Check Service URLs
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- ML Service: http://localhost:8000
- Database: localhost:5432 (inside Docker only)

## Required Credentials in .env
- `DB_PASSWORD` - Database password
- `JWT_SECRET` - JWT signing key
- `FIREBASE_PROJECT_ID` - Firebase project
- `FIREBASE_PRIVATE_KEY` - Firebase key
- `RAZORPAY_KEY_ID` - Razorpay public key
- `RAZORPAY_KEY_SECRET` - Razorpay secret

## Common Issues

**Port already in use:**
```bash
lsof -i :5000
kill -9 <PID>
```

**Container won't start:**
```bash
docker compose logs backend
docker compose restart backend
```

**Database connection failed:**
```bash
docker compose down -v
docker compose up postgres  # Wait 30+ seconds
```

**Out of disk space:**
```bash
docker system df
docker system prune -a
```

## Production Checklist
- [ ] Update `.env` with real credentials
- [ ] Change `DB_PASSWORD` to strong password
- [ ] Set `JWT_SECRET` to random secure value
- [ ] Add Firebase and Razorpay credentials
- [ ] Test locally: `docker compose up`
- [ ] Run migrations: `docker compose exec backend npx prisma migrate deploy`
- [ ] Verify all endpoints accessible
- [ ] Check health: `docker compose ps`
- [ ] Review logs: `docker compose logs`
- [ ] Deploy to production
