#!/bin/bash

echo "🔐 Installing NextAuth.js..."
npm install next-auth@latest

echo ""
echo "✅ NextAuth.js installed successfully!"
echo ""
echo "📝 Next steps:"
echo "1. Copy environment variables:"
echo "   cp .env.local.example .env.local"
echo ""
echo "2. Generate a secret:"
echo "   openssl rand -base64 32"
echo ""
echo "3. Add the secret to .env.local:"
echo "   NEXTAUTH_SECRET=your-generated-secret"
echo ""
echo "4. Start the dev server:"
echo "   npm run dev"
echo ""
echo "5. Visit http://localhost:3000/login"
echo ""
echo "📖 Full setup guide: NEXTAUTH_SETUP.md"
