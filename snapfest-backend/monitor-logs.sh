#!/bin/bash

# SnapFest Backend Log Monitor
# This script helps monitor backend logs in real-time

echo "🔍 SnapFest Backend Log Monitor"
echo "================================"
echo ""

# Check if logs directory exists
if [ ! -d "logs" ]; then
    echo "❌ Logs directory not found. Make sure the server is running."
    exit 1
fi

echo "📁 Available log files:"
ls -la logs/
echo ""

echo "📊 Log file sizes:"
du -h logs/*
echo ""

echo "🔍 Choose a log file to monitor:"
echo "1) combined.log (all logs)"
echo "2) access.log (access logs only)"
echo "3) error.log (errors only)"
echo "4) Monitor all logs"
echo "5) Exit"
echo ""

read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo "📋 Monitoring combined.log (all logs)..."
        echo "Press Ctrl+C to stop"
        tail -f logs/combined.log
        ;;
    2)
        echo "📋 Monitoring access.log (access logs only)..."
        echo "Press Ctrl+C to stop"
        tail -f logs/access.log
        ;;
    3)
        echo "📋 Monitoring error.log (errors only)..."
        echo "Press Ctrl+C to stop"
        tail -f logs/error.log
        ;;
    4)
        echo "📋 Monitoring all log files..."
        echo "Press Ctrl+C to stop"
        tail -f logs/*.log
        ;;
    5)
        echo "👋 Goodbye!"
        exit 0
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac
