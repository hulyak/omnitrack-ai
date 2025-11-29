#!/bin/bash

# Enable Local Bundling for AWS CDK (No Docker Required)
# This script updates the infrastructure stack to use local esbuild bundling

echo "🔧 Enabling local bundling for AWS CDK Lambda functions..."
echo ""

# Check if esbuild is installed
if ! command -v esbuild &> /dev/null; then
    echo "📦 Installing esbuild globally..."
    npm install -g esbuild
    echo "✅ esbuild installed"
else
    echo "✅ esbuild already installed"
fi

# Check if we're in the infrastructure directory
if [ ! -f "lib/infrastructure-stack.ts" ]; then
    echo "❌ Error: Please run this script from the infrastructure directory"
    exit 1
fi

echo ""
echo "📝 Updating infrastructure-stack.ts to use local bundling..."

# Create backup
cp lib/infrastructure-stack.ts lib/infrastructure-stack.ts.backup
echo "✅ Backup created: lib/infrastructure-stack.ts.backup"

# Update the bundling configuration
# Add forceDockerBundling: false to all bundling blocks
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' 's/bundling: {/bundling: {\n        forceDockerBundling: false,/g' lib/infrastructure-stack.ts
else
    # Linux
    sed -i 's/bundling: {/bundling: {\n        forceDockerBundling: false,/g' lib/infrastructure-stack.ts
fi

echo "✅ Updated bundling configuration"
echo ""
echo "🎉 Local bundling enabled!"
echo ""
echo "Next steps:"
echo "1. Review changes: git diff lib/infrastructure-stack.ts"
echo "2. Test synthesis: cdk synth"
echo "3. Deploy: cdk deploy --all"
echo ""
echo "To revert: cp lib/infrastructure-stack.ts.backup lib/infrastructure-stack.ts"
