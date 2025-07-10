#!/bin/bash

# Build and push Tebra Redis Worker Docker image to Google Container Registry

set -euo pipefail

# Configuration
PROJECT_ID="${GCP_PROJECT_ID:-luknerlumina-firebase}"
IMAGE_NAME="tebra-redis-worker"
IMAGE_TAG="${IMAGE_TAG:-latest}"
GCR_HOSTNAME="gcr.io"

# Full image path
FULL_IMAGE_PATH="${GCR_HOSTNAME}/${PROJECT_ID}/${IMAGE_NAME}:${IMAGE_TAG}"

echo "🐳 Building Tebra Redis Worker Docker image..."
echo "Project: ${PROJECT_ID}"
echo "Image: ${FULL_IMAGE_PATH}"

# Configure Docker to use gcloud as credential helper
echo "Configuring Docker authentication..."
gcloud auth configure-docker ${GCR_HOSTNAME} --quiet

# Build the Docker image
echo "Building Docker image..."
docker build \
  -f docker/tebra-worker/Dockerfile \
  -t ${IMAGE_NAME}:${IMAGE_TAG} \
  -t ${FULL_IMAGE_PATH} \
  .

# Push to Google Container Registry
echo "Pushing image to GCR..."
docker push ${FULL_IMAGE_PATH}

# Verify the image was pushed
echo "Verifying image in GCR..."
gcloud container images list --repository=${GCR_HOSTNAME}/${PROJECT_ID} | grep ${IMAGE_NAME}

echo "✅ Docker image successfully built and pushed!"
echo "Image URL: ${FULL_IMAGE_PATH}"
echo ""
echo "To use this image in Kubernetes:"
echo "kubectl set image deployment/tebra-redis-worker worker=${FULL_IMAGE_PATH} -n tebra-worker" 