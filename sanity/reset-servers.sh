#!/bin/bash

echo "Stopping all Node processes..."
pkill -f node

echo "Clearing Next.js cache..."
rm -rf .next

echo "Starting Sanity Studio..."
cd studio && npm run dev &

echo "Waiting for Sanity to initialize..."
sleep 5

echo "Starting Next.js..."
cd .. && npm run dev
