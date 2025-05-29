#!/usr/bin/env bash

# Start backend
echo "Starting backend..."
cd be
go mod tidy
(go run cmd/web/*) &
cd ..
# Start frontend
echo "Starting frontend..."
(cd fe && npm install && npm run dev) &

# Wait for both to exit
wait
