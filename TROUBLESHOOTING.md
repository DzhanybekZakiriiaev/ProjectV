# Troubleshooting Guide

## Common Deployment Errors

### Error: "databasepipeline_mongo_1" is not a valid container

**Problem:** Docker Compose is looking for a container with a different project name than configured.

**Solution:**

1. **Clean up old containers:**
   ```bash
   # List all containers
   docker ps -a
   
   # Remove old MongoDB containers
   docker rm -f $(docker ps -a | grep mongo | awk '{print $1}')
   
   # Or remove specific container
   docker rm -f databasepipeline_mongo_1
   ```

2. **Set explicit project name:**
   ```bash
   export COMPOSE_PROJECT_NAME=projectv
   docker-compose down
   docker-compose up -d
   ```

3. **Or use the deployment script:**
   ```bash
   chmod +x scripts/deploy.sh
   ./scripts/deploy.sh
   ```

4. **Check for environment variables:**
   ```bash
   # Check if COMPOSE_PROJECT_NAME is set
   echo $COMPOSE_PROJECT_NAME
   
   # Unset if it's wrong
   unset COMPOSE_PROJECT_NAME
   
   # Set to correct value
   export COMPOSE_PROJECT_NAME=projectv
   ```

### Error: short-name resolution enforced but cannot prompt without a TTY

**Problem:** Docker is trying to pull an image but needs authentication or there's a configuration issue.

**Solution:**

1. **Use fully qualified image names** (already done in docker-compose.yml)
2. **Check Docker configuration:**
   ```bash
   docker info
   ```

3. **Try pulling the image manually:**
   ```bash
   docker pull mongo:7.0
   ```

4. **If using private registry, login first:**
   ```bash
   docker login <registry-url>
   ```

### Container Name Conflicts

**Problem:** Containers with old names are conflicting.

**Solution:**

```bash
# Stop and remove all projectv containers
docker-compose -p projectv down

# Remove any containers with conflicting names
docker ps -a | grep -E "(databasepipeline|mongo)" | awk '{print $1}' | xargs docker rm -f

# Clean up networks
docker network prune -f

# Start fresh
docker-compose up -d
```

### MongoDB Won't Start

**Problem:** MongoDB container exits immediately or fails health checks.

**Solution:**

1. **Check MongoDB logs:**
   ```bash
   docker-compose logs mongo
   ```

2. **Check if port 27017 is already in use:**
   ```bash
   # Linux/Mac
   lsof -i :27017
   
   # Windows
   netstat -ano | findstr :27017
   ```

3. **Remove volume and restart:**
   ```bash
   docker-compose down -v
   docker-compose up -d
   ```

### API Can't Connect to MongoDB

**Problem:** API container can't reach MongoDB.

**Solution:**

1. **Check if MongoDB is running:**
   ```bash
   docker-compose ps mongo
   ```

2. **Check network connectivity:**
   ```bash
   docker-compose exec api ping mongo
   ```

3. **Verify MongoDB URI:**
   ```bash
   # Check environment variables
   docker-compose exec api env | grep MONGODB
   ```

4. **Test MongoDB connection:**
   ```bash
   docker-compose exec mongo mongosh projectv --eval "db.adminCommand('ping')"
   ```

### Port Already in Use

**Problem:** Port 3100 (or configured port) is already in use.

**Solution:**

1. **Find what's using the port:**
   ```bash
   # Linux/Mac
   lsof -i :3100
   
   # Windows
   netstat -ano | findstr :3100
   ```

2. **Change the port in .env:**
   ```env
   PORT=3101
   ```

3. **Update docker-compose.yml ports:**
   ```yaml
   ports:
     - "3101:3100"
   ```

4. **Restart:**
   ```bash
   docker-compose down
   docker-compose up -d
   ```

### Health Checks Failing

**Problem:** Container health checks are failing.

**Solution:**

1. **Check container logs:**
   ```bash
   docker-compose logs api
   ```

2. **Test health endpoint manually:**
   ```bash
   curl http://localhost:3100/health
   ```

3. **Increase start period in docker-compose.yml:**
   ```yaml
   healthcheck:
     start_period: 40s  # Increase from 20s
   ```

4. **Check if curl is available in container:**
   ```bash
   docker-compose exec api which curl
   ```

## Quick Fix Commands

### Complete Reset

```bash
# Stop and remove everything
docker-compose down -v --remove-orphans

# Remove any orphaned containers
docker ps -a | grep -E "(projectv|mongo)" | awk '{print $1}' | xargs docker rm -f

# Clean networks
docker network prune -f

# Start fresh
export COMPOSE_PROJECT_NAME=projectv
docker-compose up -d --build
```

### View All Containers

```bash
# List all containers
docker ps -a

# Filter by name
docker ps -a | grep projectv

# Filter by name pattern
docker ps -a --filter "name=mongo"
```

### Force Rebuild

```bash
# Rebuild without cache
docker-compose build --no-cache

# Rebuild and restart
docker-compose up -d --build --force-recreate
```

## Getting Help

1. **Check logs:**
   ```bash
   docker-compose logs -f
   ```

2. **Check container status:**
   ```bash
   docker-compose ps
   ```

3. **Check Docker system info:**
   ```bash
   docker system df
   docker system info
   ```

4. **Review DEPLOYMENT.md** for detailed deployment instructions

5. **Check main README.md** for general project information

