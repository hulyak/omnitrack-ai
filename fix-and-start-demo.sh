#!/bin/bash

# Fix and Start Demo - Clears locks and starts fresh

echo "🔧 Fixing Demo Issues..."
echo ""

# Kill any process on port 3000-3002
echo "Killing any existing Next.js processes..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:3002 | xargs kill -9 2>/dev/null || true

# Remove lock file
echo "Removing lock files..."
rm -rf frontend/.next/dev/lock 2>/dev/null || true

# Clear .next cache
echo "Clearing Next.js cache..."
rm -rf frontend/.next 2>/dev/null || true

echo ""
echo "✅ Fixed! Starting demo..."
echo ""

# Start the demo
cd frontend
npm run dev
