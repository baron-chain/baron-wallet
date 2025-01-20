#!/usr/bin/env bash

# Baron Wallet EAS Environment Preparation Script
# Configures npm registry, installs secrets, and sets up build dependencies

set -euo pipefail

# Logging function
log() {
    echo "[Baron Wallet Build] $1"
}

# Error handling function
handle_error() {
    log "Error: $1"
    exit 1
}

# Configure NPM Registry
configure_npm_registry() {
    if [[ -z "${NPM_TOKEN:-}" ]]; then
        handle_error "NPM_TOKEN is not set"
    fi

    log "Configuring NPM registry..."
    echo "@baron-chain:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NPM_TOKEN}" > ~/.npmrc
}

# Install Secret Keys
install_secrets() {
    log "Installing secret keys..."

    # Validate secret environment variables
    if [[ -z "${IOS_SECRET:-}" ]]; then
        handle_error "IOS_SECRET is not set"
    fi

    if [[ -z "${ANDROID_SECRET:-}" ]]; then
        handle_error "ANDROID_SECRET is not set"
    fi

    # Decode and install secrets
    echo "$IOS_SECRET" | base64 -d > .env || handle_error "Failed to decode iOS secrets"
    echo "$ANDROID_SECRET" | base64 -d > android/keys.secret || handle_error "Failed to decode Android secrets"

    log "Secrets installed successfully"
}

# Install build dependencies
install_build_dependencies() {
    log "Installing build dependencies..."

    # Install CMake for react-native-reanimated
    if command -v sdkmanager &> /dev/null; then
        log "Installing CMake 3.18.1..."
        sdkmanager "cmake;3.18.1" || handle_error "Failed to install CMake"
    else
        log "Android SDK manager not found. Skipping CMake installation."
    fi
}

# Main script execution
main() {
    log "Starting Baron Wallet build preparation..."
    
    configure_npm_registry
    install_secrets
    install_build_dependencies
    
    log "Build preparation completed successfully"
}

# Execute main function
main
