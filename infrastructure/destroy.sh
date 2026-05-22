#!/bin/bash

# OmniTrack AI Infrastructure Destroy Script
# This script destroys the OmniTrack AI infrastructure

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_error ".env file not found!"
    exit 1
fi

# Load environment variables
print_info "Loading environment variables from .env file..."
export $(cat .env | grep -v '^#' | xargs)

print_warning "=== DANGER ZONE ==="
print_warning "This will DESTROY all OmniTrack AI infrastructure in AWS."
print_warning "This action CANNOT be undone!"
print_warning ""
print_warning "Account: $AWS_ACCOUNT_ID"
print_warning "Region: $AWS_REGION"
print_warning "Stack: ${STACK_NAME:-omnitrack-ai}"
print_warning ""
print_error "All data will be PERMANENTLY DELETED!"
echo ""

read -p "Type 'DELETE' to confirm destruction: " CONFIRM

if [ "$CONFIRM" != "DELETE" ]; then
    print_info "Destruction cancelled."
    exit 0
fi

print_info "Destroying infrastructure..."
npx cdk destroy --force

if [ $? -eq 0 ]; then
    print_success "Infrastructure destroyed successfully!"
    
    # Clean up generated files
    if [ -f "outputs.json" ]; then
        rm outputs.json
        print_info "Removed outputs.json"
    fi
    
    if [ -f ".env.production" ]; then
        rm .env.production
        print_info "Removed .env.production"
    fi
else
    print_error "Destruction failed!"
    exit 1
fi
