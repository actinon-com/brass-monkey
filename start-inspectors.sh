#!/bin/bash

# Multi-MCP Inspector Orchestrator
# Launches Production, Development, and/or Python reference inspectors selectively.

# Function to cleanly stop all background processes on exit
cleanup() {
    echo -e "\n\n🛑 Shutting down active MCP Inspectors..."
    # Kill all child background processes belonging to this script session
    kill $(jobs -p) 2>/dev/null
    exit 0
}

# Set up process trap to run cleanup on Ctrl+C (SIGINT) and SIGTERM
trap cleanup SIGINT SIGTERM

# Initialize flags
START_PROD=false
START_DEV=false
START_LEGACY=false

# Print usage help
show_help() {
    echo "Usage: ./start-inspectors.sh [switches]"
    echo ""
    echo "Switches:"
    echo "  --all       Start all three inspectors (Default)"
    echo "  --prod      Start only the Production Inspector (Port 6274, Proxy 6277)"
    echo "  --dev       Start only the Development Inspector (Port 6275, Proxy 6278)"
    echo "  --legacy    Start only the Brass-Compass Python Inspector (Port 6276, Proxy 6279)"
    echo "  --help      Show this help menu"
    exit 0
}

# Parse command line arguments
if [ $# -eq 0 ]; then
    # Default: If no switches passed, start all
    START_PROD=true
    START_DEV=true
    START_LEGACY=true
else
    while [[ $# -gt 0 ]]; do
        case $1 in
            --all)
                START_PROD=true
                START_DEV=true
                START_LEGACY=true
                shift
                ;;
            --prod)
                START_PROD=true
                shift
                ;;
            --dev)
                START_DEV=true
                shift
                ;;
            --legacy)
                START_LEGACY=true
                shift
                ;;
            --help|-h)
                show_help
                ;;
            *)
                echo "Unknown switch: $1"
                show_help
                ;;
        esac
    done
fi

echo "========================================================"
echo "🚀 Brass Monkey & Compass - Multi-Inspector Orchestrator"
echo "========================================================"

# 1. Production Inspector
if [ "$START_PROD" = true ]; then
    echo "📡 Launching Production (Global Copy) on port 6274..."
    CLIENT_PORT=6274 SERVER_PORT=6277 npx @modelcontextprotocol/inspector node /home/mcm/.gemini/extensions/brass-monkey/dist/bundle/index.js &
fi

# 2. Development Inspector
if [ "$START_DEV" = true ]; then
    echo "📡 Launching Development (Workspace Copy) on port 6275..."
    CLIENT_PORT=6275 SERVER_PORT=6278 npx @modelcontextprotocol/inspector node --env-file=.env dist/bundle/index.js &
fi

# 3. Python Reference Inspector (Brass-Compass)
if [ "$START_LEGACY" = true ]; then
    if [ -d "reference/brass-compass/.venv" ]; then
        echo "📡 Launching Brass-Compass (Python) on port 6276..."
        (cd reference/brass-compass && CLIENT_PORT=6276 SERVER_PORT=6279 npx @modelcontextprotocol/inspector .venv/bin/python -m brass_compass.server start) &
    else
        echo "⚠️  Python virtualenv not found at 'reference/brass-compass/.venv'."
        echo "   -> Run python3 -m venv reference/brass-compass/.venv first."
    fi
fi

echo -e "\n🎉 Active inspectors launched!"
echo "--------------------------------------------------------"
if [ "$START_PROD" = true ]; then
    echo "🔗 Production:  http://localhost:6274"
fi
if [ "$START_DEV" = true ]; then
    echo "🔗 Development: http://localhost:6275"
fi
if [ "$START_LEGACY" = true ] && [ -d "reference/brass-compass/.venv" ]; then
    echo "🔗 Python Ref:  http://localhost:6276"
fi
echo "--------------------------------------------------------"
echo -e "Press [Ctrl+C] to stop active services simultaneously.\n"

# Keep the shell session alive to process job traps
wait
