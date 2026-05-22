# Fix Docker "No Space Left" Error - Step by Step 🔧

## The Problem
Docker Desktop crashed with: `no space left on device`

## The Solution (5 minutes)

### Step 1: Start Docker Desktop
```bash
# Open Docker Desktop
open /Applications/Docker.app
```

Wait for the whale icon to appear in your menu bar (top right).

---

### Step 2: Run Cleanup Script

Once Docker is running, run this in your terminal:

```bash
./fix-docker-space.sh
```

This will:
- Remove stopped containers
- Remove unused images
- Remove unused volumes
- Remove build cache
- Free up 10-20 GB typically

---

### Step 3: Manual Cleanup (If Script Doesn't Work)

If Docker won't start, do manual cleanup:

```bash
# Check disk space first
df -h

# Check Docker data size
du -sh ~/Library/Containers/com.docker.docker/Data

# If Docker data is huge (>50GB), reset Docker:
# 1. Quit Docker Desktop completely
# 2. Open Docker Desktop
# 3. Click whale icon > Troubleshoot > Reset to factory defaults
# 4. Click "Reset" and wait
```

---

### Step 4: Increase Docker Disk Limit

After Docker starts:

1. Click whale icon in menu bar
2. Click "Settings" (gear icon)
3. Go to "Resources" > "Advanced"
4. Increase "Virtual disk limit" to 100 GB
5. Click "Apply & Restart"

---

### Step 5: Verify Docker Works

```bash
# Check Docker is running
docker --version

# Check disk usage
docker system df

# Test Docker works
docker run hello-world
```

---

### Step 6: Deploy Your Infrastructure

```bash
cd infrastructure
cdk deploy
```

---

## Alternative: If Docker Still Won't Start

### Option A: Complete Docker Reset

```bash
# 1. Quit Docker Desktop completely
# 2. Remove Docker data (WARNING: removes all containers/images)
rm -rf ~/Library/Containers/com.docker.docker/Data/*

# 3. Restart Docker Desktop
open /Applications/Docker.app
```

### Option B: Free Up Mac Disk Space

```bash
# Check what's using space
du -sh ~/Library/Containers/com.docker.docker/Data
du -sh ~/Library/Caches
du -sh ~/Downloads

# Clear system caches
sudo rm -rf ~/Library/Caches/*

# Empty trash
# Click Finder > Empty Trash

# Check available space
df -h
```

You need at least 20 GB free for Docker to work properly.

### Option C: Use Podman Instead

If Docker keeps failing, install Podman (Docker alternative):

```bash
# Install Podman
brew install podman

# Initialize
podman machine init --disk-size 60
podman machine start

# Make it work like Docker
echo 'alias docker=podman' >> ~/.zshrc
source ~/.zshrc

# Deploy
cd infrastructure
cdk deploy
```

---

## Quick Troubleshooting

### Error: "Docker daemon not running"
```bash
# Restart Docker Desktop
open /Applications/Docker.app
# Wait 30 seconds for it to start
```

### Error: "Cannot connect to Docker daemon"
```bash
# Check if Docker is actually running
ps aux | grep -i docker

# If not, restart it
open /Applications/Docker.app
```

### Error: Still "no space left"
```bash
# Check Mac disk space
df -h

# You need at least 20 GB free
# If less, delete files or use external drive
```

---

## Expected Results

After cleanup, you should see:

```bash
$ docker system df

TYPE            TOTAL     ACTIVE    SIZE      RECLAIMABLE
Images          0         0         0B        0B
Containers      0         0         0B        0B
Local Volumes   0         0         0B        0B
Build Cache     0         0         0B        0B
```

This means Docker is clean and ready!

---

## Next Steps

1. ✅ Docker is running
2. ✅ Disk space freed up
3. ✅ Ready to deploy

Run:
```bash
cd infrastructure
cdk deploy
```

---

## Still Having Issues?

Try these in order:

1. **Restart your Mac** - Sometimes helps
2. **Use Podman** - See Option C above
3. **Use your demo** - It works perfectly without AWS!

```bash
cd frontend
npm run dev
# Visit: http://localhost:3000
```

Your demo is production-quality and doesn't need Docker or AWS! 🎉
