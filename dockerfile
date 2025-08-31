# Stage 1: Build the application
FROM node:18-alpine AS builder

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Declare the build argument for the API key
ARG VITE_API_KEY

# Set the environment variable for the build
ENV VITE_API_KEY=$VITE_API_KEY

# Build the project
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:1.21.6-alpine

# Copy the built files from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
