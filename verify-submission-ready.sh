#!/bin/bash

# OmniTrack AI - Verify Submission Readiness
# This script checks if the project is ready for hackathon submission

echo "🔍 Verifying OmniTrack AI Submission Readiness..."
echo ""

ERRORS=0
WARNINGS=0

# Check essential documentation
echo "📄 Checking essential documentation..."
REQUIRED_DOCS=(
    "README.md"
    "START_HERE_HACKATHON.md"
    "HACKATHON_PROJECT_DESCRIPTION.md"
    "HACKATHON_DOCS_INDEX.md"
    "HACKATHON_READY_GUIDE.md"
    "HACKATHON_SUBMISSION_MASTER_CHECKLIST.md"
    "PITCH.md"
    "VISION.md"
    "SETUP.md"
    "DEPLOYMENT_GUIDE.md"
    "VIDEO_SCRIPT_DETAILED.md"
    "SCREENSHOT_CAPTURE_GUIDE.md"
    "SUPPLY_CHAIN_FLOW_DIAGRAM.md"
)

for doc in "${REQUIRED_DOCS[@]}"; do
    if [ -f "$doc" ]; then
        echo "  ✅ $doc"
    else
        echo "  ❌ $doc - MISSING"
        ((ERRORS++))
    fi
done

# Check source directories
echo ""
echo "📁 Checking source directories..."
REQUIRED_DIRS=(
    "frontend"
    "frontend/app"
    "frontend/components"
    "frontend/lib"
    "infrastructure"
    "infrastructure/lambda"
    "infrastructure/lib"
    "scripts"
    "docs"
    "docs/hackathon"
    "docs/architecture"
    "docs/api"
)

for dir in "${REQUIRED_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo "  ✅ $dir/"
    else
        echo "  ❌ $dir/ - MISSING"
        ((ERRORS++))
    fi
done

# Check essential scripts
echo ""
echo "🔧 Checking essential scripts..."
REQUIRED_SCRIPTS=(
    "fix-and-start-demo.sh"
    "verify-setup.sh"
    "cleanup-for-submission.sh"
    "create-submission-package.sh"
)

for script in "${REQUIRED_SCRIPTS[@]}"; do
    if [ -f "$script" ]; then
        if [ -x "$script" ]; then
            echo "  ✅ $script (executable)"
        else
            echo "  ⚠️  $script (not executable)"
            ((WARNINGS++))
        fi
    else
        echo "  ❌ $script - MISSING"
        ((ERRORS++))
    fi
done

# Check for unwanted files
echo ""
echo "🗑️  Checking for unwanted files..."
UNWANTED_PATTERNS=(
    "node_modules"
    ".next"
    "cdk.out"
    ".DS_Store"
    "*.log"
)

FOUND_UNWANTED=0
for pattern in "${UNWANTED_PATTERNS[@]}"; do
    if [ "$pattern" = "node_modules" ] || [ "$pattern" = ".next" ] || [ "$pattern" = "cdk.out" ]; then
        # Check directories
        if find . -type d -name "$pattern" -not -path "./.archive/*" 2>/dev/null | grep -q .; then
            echo "  ⚠️  Found $pattern directories (should be cleaned)"
            ((WARNINGS++))
            FOUND_UNWANTED=1
        fi
    else
        # Check files
        if find . -name "$pattern" -not -path "./.archive/*" -not -path "./node_modules/*" 2>/dev/null | grep -q .; then
            echo "  ⚠️  Found $pattern files"
            ((WARNINGS++))
            FOUND_UNWANTED=1
        fi
    fi
done

if [ $FOUND_UNWANTED -eq 0 ]; then
    echo "  ✅ No unwanted files found"
fi

# Check package.json files
echo ""
echo "📦 Checking package.json files..."
if [ -f "package.json" ]; then
    echo "  ✅ Root package.json"
else
    echo "  ❌ Root package.json - MISSING"
    ((ERRORS++))
fi

if [ -f "frontend/package.json" ]; then
    echo "  ✅ Frontend package.json"
else
    echo "  ❌ Frontend package.json - MISSING"
    ((ERRORS++))
fi

# Check for sensitive data
echo ""
echo "🔐 Checking for sensitive data..."
SENSITIVE_FILES=(
    "infrastructure/.env"
    ".env"
    "frontend/.env.local"
)

FOUND_SENSITIVE=0
for file in "${SENSITIVE_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  ⚠️  Found $file (should not be committed)"
        ((WARNINGS++))
        FOUND_SENSITIVE=1
    fi
done

if [ $FOUND_SENSITIVE -eq 0 ]; then
    echo "  ✅ No sensitive files found"
fi

# Check .gitignore
echo ""
echo "📝 Checking .gitignore..."
if [ -f ".gitignore" ]; then
    echo "  ✅ .gitignore exists"
    
    # Check for important entries
    GITIGNORE_ENTRIES=(
        "node_modules"
        ".env"
        ".next"
        "cdk.out"
    )
    
    for entry in "${GITIGNORE_ENTRIES[@]}"; do
        if grep -q "$entry" .gitignore; then
            echo "  ✅ .gitignore includes $entry"
        else
            echo "  ⚠️  .gitignore missing $entry"
            ((WARNINGS++))
        fi
    done
else
    echo "  ❌ .gitignore - MISSING"
    ((ERRORS++))
fi

# Check archive directory
echo ""
echo "📦 Checking archive..."
if [ -d ".archive" ]; then
    ARCHIVE_SIZE=$(du -sh .archive 2>/dev/null | cut -f1)
    ARCHIVE_FILES=$(find .archive -type f 2>/dev/null | wc -l)
    echo "  ✅ Archive exists ($ARCHIVE_SIZE, $ARCHIVE_FILES files)"
else
    echo "  ⚠️  No archive directory (cleanup may not have run)"
    ((WARNINGS++))
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 VERIFICATION SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo "✅ ALL CHECKS PASSED!"
    echo ""
    echo "🎉 Your project is ready for submission!"
    echo ""
    echo "Next steps:"
    echo "  1. Run: ./create-submission-package.sh"
    echo "  2. Test the demo: ./fix-and-start-demo.sh"
    echo "  3. Record demo video"
    echo "  4. Capture screenshots"
    echo "  5. Submit to hackathon platform"
    echo ""
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo "⚠️  PASSED WITH WARNINGS"
    echo ""
    echo "Warnings: $WARNINGS"
    echo ""
    echo "Your project is mostly ready, but please review the warnings above."
    echo ""
    echo "You can proceed with:"
    echo "  ./create-submission-package.sh"
    echo ""
    exit 0
else
    echo "❌ VERIFICATION FAILED"
    echo ""
    echo "Errors: $ERRORS"
    echo "Warnings: $WARNINGS"
    echo ""
    echo "Please fix the errors above before submitting."
    echo ""
    exit 1
fi
