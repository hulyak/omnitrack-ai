#!/bin/bash

echo "🔧 Fixing Frontend Dependencies..."
echo ""

cd frontend

# Clean Next.js cache
echo "1. Cleaning Next.js cache..."
rm -rf .next
rm -rf node_modules/.cache

# Reinstall dependencies
echo "2. Reinstalling dependencies..."
npm install

echo ""
echo "✅ Dependencies fixed!"
echo ""
echo "Now restart your dev server:"
echo "  cd frontend"
echo "  npm run dev"
