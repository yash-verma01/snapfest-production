#!/bin/bash

# SnapFest Multi-App Launcher
# This script kills any existing processes on ports 3000-3002, 5000, and 5173
# Then starts all three SnapFest applications on separate ports

# Function to kill processes on specific ports
kill_port() {
    local port=$1
    local pids=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$pids" ]; then
        echo "🔄 Killing processes on port $port (PIDs: $pids)..."
        echo $pids | xargs kill -9 2>/dev/null
        sleep 1
        
        # Double check if processes are still running
        local remaining_pids=$(lsof -ti:$port 2>/dev/null)
        if [ ! -z "$remaining_pids" ]; then
            echo "⚠️  Force killing remaining processes on port $port..."
            echo $remaining_pids | xargs kill -9 2>/dev/null
        fi
    fi
}

# Kill all running processes on our ports
echo "🧹 Cleaning up existing processes..."
echo "   - Killing processes on ports 3000, 3001, 3002 (frontend apps)"
echo "   - Killing processes on port 5000 (backend)"
echo "   - Killing processes on port 5173 (default Vite port)"
echo ""

kill_port 3000
kill_port 3001
kill_port 3002
kill_port 5000  # Backend port
kill_port 5173  # Default Vite port

# Verify ports are free
echo "🔍 Verifying ports are free..."
for port in 3000 3001 3002; do
    if lsof -ti:$port >/dev/null 2>&1; then
        echo "❌ Port $port is still in use!"
        echo "   Try running: lsof -ti:$port | xargs kill -9"
        exit 1
    else
        echo "✅ Port $port is free"
    fi
done

echo "✅ Port cleanup completed"
echo ""

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
    
    # Kill the specific processes we started
    kill $USER_PID $VENDOR_PID $ADMIN_PID 2>/dev/null
    
    # Also kill any remaining processes on our ports
    kill_port 3000
    kill_port 3001
    kill_port 3002
    
    echo "✅ All applications stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM
