#!/usr/bin/env bash

# Exit on error, undefined variables, and print commands
set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Function to copy files with error handling
copy_file() {
    local src=$1
    local dest=$2
    log_info "Copying: ${src} → ${dest}"
    
    if [ ! -f "$src" ]; then
        log_error "Source file not found: $src"
    fi
    
    mkdir -p "$(dirname "$dest")"
    if ! cp "$src" "$dest"; then
        log_error "Failed to copy: $src to $dest"
    fi
    
    log_success "Copied successfully: $(basename "$src")"
}

# Function to ensure directory exists
ensure_dir() {
    local dir=$1
    log_info "Ensuring directory exists: $dir"
    
    if ! mkdir -p "$dir"; then
        log_error "Failed to create directory: $dir"
    fi
}

# Main execution block
{
    log_info "Starting Baron Wallet build setup..."
    
    # Copy provider files
    log_info "Setting up provider files..."
    
    # Desktop preload
    copy_file "./node_modules/@baron-chain/cross-inpage-provider-injected/dist/injected/injectedDesktop.js" \
              "./packages/desktop/public/static/preload.js"
    
    # Extension files
    copy_file "./node_modules/@baron-chain/cross-inpage-provider-injected/dist/injected/injectedExtension.js" \
              "./packages/ext/src/entry/injected.js"
    
    copy_file "./packages/ext/src/entry/injected.js" \
              "./packages/ext/src/entry/injected.text-js"
    
    # Native injection code
    copy_file "./node_modules/@baron-chain/cross-inpage-provider-injected/dist/injected/injectedNative.js" \
              "./packages/kit/src/components/WebView/injectedNative.text-js"
    
    # Web template
    copy_file "./packages/shared/src/web/index.html.ejs" \
              "./packages/shared/src/web/index.html"
    
    # Setup hardware SDK
    log_info "Setting up hardware SDK..."
    JS_SDK_DEST="./packages/desktop/public/static/js-sdk/"
    ensure_dir "$JS_SDK_DEST"
    
    if ! rsync ./node_modules/@baron-chain/hardware-sdk/build/ "$JS_SDK_DEST" --checksum --recursive --quiet; then
        log_error "Failed to sync hardware SDK files"
    fi
    
    # Build web-embed package
    log_info "Processing web-embed..."
    if [ "${EAS_BUILD:-false}" = "true" ]; then
        log_info "Building web-embed for EAS build"
        if ! yarn workspace @baron-chain/web-embed build; then
            log_error "Failed to build web-embed for EAS"
        fi
    elif [ ! -d "packages/web-embed/web-build" ]; then
        log_info "Building web-embed from scratch"
        if ! yarn workspace @baron-chain/web-embed build; then
            log_error "Failed to build web-embed"
        fi
    else
        log_warning "Skipping web-embed build (directory exists)"
    fi
    
    log_success "Build setup completed successfully"
    
    # Optional: Print build info
    {
        log_info "Build Info:"
        echo "  Node Version: $(node -v)"
        echo "  Yarn Version: $(yarn -v)"
        echo "  Build Date: $(date)"
    }

} 2>&1 | tee -a build-setup.log

# Check if script succeeded
if [ "${PIPESTATUS[0]}" -eq 0 ]; then
    log_success "Build setup log saved to: build-setup.log"
else
    log_error "Build setup failed. Check build-setup.log for details"
fi
