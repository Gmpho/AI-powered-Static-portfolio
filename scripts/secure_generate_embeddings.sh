#!/bin/bash

# This script generates embeddings for projects and uploads them to a Cloudflare KV namespace.

# Exit immediately if a command exits with a non-zero status.
set -e

# Check if the KV namespace ID is provided as an environment variable
if [ -z "$PROJECT_EMBEDDINGS_KV_ID" ]; then
  echo "Error: PROJECT_EMBEDDINGS_KV_ID is not set." >&2
  echo "Please set it: export PROJECT_EMBEDDINGS_KV_ID='your-kv-namespace-id-here'" >&2
  exit 1
fi

# Check if the Gemini API key is provided as an environment variable
if [ -z "$GEMINI_API_KEY" ]; then
  echo "Error: GEMINI_API_KEY is not set." >&2
  echo "Please set it: export GEMINI_API_KEY='your-gemini-api-key-here'" >&2
  exit 1
fi

# The ID of your KV namespace from the environment variable
KV_NAMESPACE_ID="$PROJECT_EMBEDDINGS_KV_ID"

# Compile the TypeScript script
npx esbuild scripts/generateEmbeddings.ts --bundle --platform=node --outfile=scripts/dist/bundle.cjs --resolve-extensions=.ts,.js,.json

# Execute the script and capture the output
if node_output=$(node scripts/dist/bundle.cjs); then
    # Process the output only if the script was successful
    echo "$node_output" | while read -r line; do
        # Extract the project title and the embedding
        TITLE=$(echo "$line" | sed -n 's/^Embedding for \(.*\):.*$/\1/p')
        EMBEDDING=$(echo "$line" | sed -n 's/^Embedding for .*:\(.*\)$/\1/p')

        # Sanitize the title to use as a KV key
        KEY=$(echo "$TITLE" | tr ' ' '_' | tr '[:upper:]' '[:lower:]')

        # Check if the key and embedding are not empty
        if [ -n "$KEY" ] && [ -n "$EMBEDDING" ]; then
            echo "Uploading embedding for project: $TITLE (key: $KEY)"

            # Upload the embedding to the KV namespace using the ID
            npx wrangler kv:put "$KEY" "$EMBEDDING" --namespace-id="$KV_NAMESPACE_ID" --yes
        fi
    done
    echo "All project embeddings have been successfully uploaded to the KV namespace."
else
    # Handle the error from the node script
    echo "Error: Failed to generate embeddings. The node script exited with an error." >&2
    echo "Please check the error message above. It is likely a Google AI API quota issue." >&2
    exit 1
fi