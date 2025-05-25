#!/bin/bash

# Function to check if a process is running
is_running() {
    pgrep -f "$1" >/dev/null
}

echo "🔄 Starting server reset process..."

# Kill any existing Node processes
echo "📋 Stopping all Node processes..."
if is_running "node"; then
    pkill -f node
    sleep 2
fi

# Clear Next.js cache
echo "🧹 Clearing Next.js cache..."
if [ -d ".next" ]; then
    rm -rf .next
fi

# Ensure we're in the right directory
PROJECT_ROOT="$(pwd)"

# Start Sanity Studio
echo "🚀 Starting Sanity Studio..."
if [ -d "sanity" ]; then
    cd sanity
    npm run dev &
    SANITY_PID=$!
    cd "$PROJECT_ROOT"
else
    echo "❌ Error: 'sanity' directory not found"
    exit 1
fi

# Wait for Sanity to initialize
echo "⏳ Waiting for Sanity to initialize..."
sleep 5

# Start Next.js
echo "🚀 Starting Next.js..."
npm run dev &
NEXTJS_PID=$!

# Wait for both processes
echo "✨ Servers are starting up..."
echo "📝 To stop the servers, press Ctrl+C"

# Handle script termination
trap 'kill $SANITY_PID $NEXTJS_PID 2>/dev/null' EXIT

# Keep script running and show both processes
wait 