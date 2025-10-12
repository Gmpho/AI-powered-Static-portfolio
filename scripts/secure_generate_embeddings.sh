#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Ensure the API key is provided as an environment variable
if [ -z "$GEMINI_API_KEY" ]; then
  echo "Error: GEMINI_API_KEY is not set." >&2
  exit 1
fi

# Execute the TypeScript script, passing the API key securely
# The script itself should read GEMINI_API_KEY from its environment
GEMINI_API_KEY="$GEMINI_API_KEY" node scripts/generateEmbeddings.ts > embeddings.json
