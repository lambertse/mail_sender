#!/bin/bash
set -e

mkdir -p "build/"

# Build the Go server
cd be/
echo "Building server"
go build -o ../build/server ./cmd/web/* 
echo "Build complete!"
cd ..

# Build the React server
cd fe/
echo "Build frontend"
npm install
npm run build
echo "Build frontend complete!"
