#!/bin/bash

# Start all three SnapFest applications
echo "🚀 Starting SnapFest Applications..."

# Start User App (Port 3000)
echo "👤 Starting User App on port 3000..."
npm run dev:user &
USER_PID=$!

# Start Vendor App (Port 3001)
echo "🏪 Starting Vendor App on port 3001..."
npm run dev:vendor &
VENDOR_PID=$!

# Start Admin App (Port 3002)
echo "👑 Starting Admin App on port 3002..."
npm run dev:admin &
ADMIN_PID=$!

echo ""
echo "✅ All applications started successfully!"
echo ""
echo "🌐 Access URLs:"
echo "   👤 User Portal:    http://localhost:3000"
echo "   🏪 Vendor Portal:  http://localhost:3001"
echo "   👑 Admin Portal:   http://localhost:3002"
echo ""
echo "Press Ctrl+C to stop all applications"

# Wait for user to stop
wait

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Stopping all applications..."
    kill $USER_PID $VENDOR_PID $ADMIN_PID 2>/dev/null
    echo "✅ All applications stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM
