#!/usr/bin/env bash
set -ex

# Function to copy files
copy_file() {
    local src=$1
    local dest=$2
    echo "Copying $src to $dest"
    cp "$src" "$dest"
}

# Function to ensure directory exists
ensure_dir() {
    local dir=$1
    echo "Ensuring directory exists: $dir"
    mkdir -p "$dir"
}

# Copy preload.js to Desktop
copy_file "./node_modules/@baronfe/cross-inpage-provider-injected/dist/injected/injectedDesktop.js" \
          "./packages/desktop/public/static/preload.js"

# Copy injected.js to Extension
copy_file "./node_modules/@baronfe/cross-inpage-provider-injected/dist/injected/injectedExtension.js" \
          "./packages/ext/src/entry/injected.js"
copy_file "./packages/ext/src/entry/injected.js" \
          "./packages/ext/src/entry/injected.text-js"

# Copy injectedCode to Native
copy_file "./node_modules/@baronfe/cross-inpage-provider-injected/dist/injected/injectedNative.js" \
          "./packages/kit/src/components/WebView/injectedNative.text-js"

# Copy index.html
copy_file "./packages/shared/src/web/index.html.ejs" \
          "./packages/shared/src/web/index.html"

# Copy hardware js-sdk iframe files to desktop
JS_SDK_DEST="./packages/desktop/public/static/js-sdk/"
ensure_dir "$JS_SDK_DEST"
echo "Syncing js-sdk files"
rsync ./node_modules/@baronfe/hd-web-sdk/build/ "$JS_SDK_DEST" --checksum --recursive --verbose

# Build and copy web-embed
if [ "$EAS_BUILD" == "true" ]; then
    echo "Building web-embed for EAS build"
    yarn workspace @baronhq/web-embed build
elif [ ! -d "packages/web-embed/web-build" ]; then
    echo "Building web-embed"
    yarn workspace @baronhq/web-embed build
else
    echo "Skipping web-embed build, directory already exists"
fi

echo "Build script completed successfully"
