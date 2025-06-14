#!/bin/bash

# Version management script for Tebra Proxy service

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to display usage
usage() {
    echo "Usage: $0 [command]"
    echo "Commands:"
    echo "  current    - Show current version"
    echo "  bump [type] - Bump version (major|minor|patch)"
    echo "  tag        - Create git tag for current version"
    echo "  release    - Create release (bump, tag, and update changelog)"
    exit 1
}

# Function to get current version
get_current_version() {
    # Extract version from cloudrun.yaml
    version=$(grep -o 'v[0-9]\+\.[0-9]\+\.[0-9]\+' cloudrun.yaml | head -1)
    echo "${version#v}" # Remove 'v' prefix
}

# Function to bump version
bump_version() {
    local type=$1
    local current=$(get_current_version)
    local major minor patch
    
    IFS='.' read -r major minor patch <<< "$current"
    
    case $type in
        major)
            major=$((major + 1))
            minor=0
            patch=0
            ;;
        minor)
            minor=$((minor + 1))
            patch=0
            ;;
        patch)
            patch=$((patch + 1))
            ;;
        *)
            echo -e "${RED}Error: Invalid version type. Use major|minor|patch${NC}"
            exit 1
            ;;
    esac
    
    echo "v$major.$minor.$patch"
}

# Function to update files with new version
update_version() {
    local new_version=$1
    
    # Update cloudrun.yaml
    sed -i '' "s|image: gcr.io/\${PROJECT_ID}/tebra-proxy:v[0-9]\+\.[0-9]\+\.[0-9]\+|image: gcr.io/\${PROJECT_ID}/tebra-proxy:$new_version|" cloudrun.yaml
    
    echo -e "${GREEN}Updated version to $new_version${NC}"
}

# Function to create git tag
create_tag() {
    local version=$1
    git tag -a "$version" -m "Release $version"
    echo -e "${GREEN}Created git tag $version${NC}"
}

# Main script logic
case "$1" in
    current)
        echo "Current version: $(get_current_version)"
        ;;
    bump)
        if [ -z "$2" ]; then
            echo -e "${RED}Error: Version type required${NC}"
            usage
        fi
        new_version=$(bump_version "$2")
        update_version "$new_version"
        ;;
    tag)
        version="v$(get_current_version)"
        create_tag "$version"
        ;;
    release)
        if [ -z "$2" ]; then
            echo -e "${RED}Error: Version type required${NC}"
            usage
        fi
        new_version=$(bump_version "$2")
        update_version "$new_version"
        create_tag "$new_version"
        echo -e "${YELLOW}Please update CHANGELOG.md with release notes${NC}"
        ;;
    *)
        usage
        ;;
esac 