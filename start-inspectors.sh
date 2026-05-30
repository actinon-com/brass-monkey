#!/bin/bash

# Multi-MCP Inspector Orchestrator
# Launches Production, Development, and Python reference inspectors in parallel.

# Function to cleanly stop all background processes on exit
cleanup() {
    echo -e "\n\n🛑 Shutting down all MCP Inspectors..."
    # Kill all child background processes belonging to this script session
    kill $(jobs -p) 2>/dev/null
    exit 0
}

# Set up process trap to run cleanup on Ctrl+C (SIGINT) and SIGTERM
trap cleanup SIGINT SIGTERM

echo "========================================================"
echo "🚀 Brass Monkey & Compass - Multi-Inspector Orchestrator"
echo "========================================================"

# 1. Production Inspector (Port 6274, Proxy 6277)
# Uses the global Gemini CLI extension build, inheriting global config
echo "📡 [1/3] Launching Production (Global Copy) on port 6274..."
CLIENT_PORT=6274 SERVER_PORT=6277 npx @modelcontextprotocol/inspector node /home/mcm/.gemini/extensions/brass-monkey/dist/bundle/index.js &

# 2. Development Inspector (Port 6275, Proxy 6278)
# Uses your active Webstorm workspace code with isolated local .env credentials
echo "📡 [2/3] Launching Development (Workspace Copy) on port 6275..."
CLIENT_PORT=6275 SERVER_PORT=6278 npx @modelcontextprotocol/inspector node --env-file=.env dist/bundle/index.js &

# 3. Python Reference Inspector (Port 6276, Proxy 6279)
# Uses the python virtualenv built in the reference directory
if [ -d "reference/brass-compass/.venv" ]; then
    echo "📡 [3/3] Launching Brass-Compass (Python) on port 6276..."
    (cd reference/brass-compass && CLIENT_PORT=6276 SERVER_PORT=6279 npx @modelcontextprotocol/inspector .venv/bin/python -m brass_compass.server start) &
else
    echo "⚠️  [3/3] Python virtualenv not found at 'reference/brass-compass/.venv'."
    echo "   -> Run python3 -m venv reference/brass-compass/.venv first."
fi

echo -e "\n🎉 All active inspectors launched!"
echo "--------------------------------------------------------"
echo "🔗 Production:  http://localhost:6274"
echo "🔗 Development: http://localhost:6275"
if [ -f "reference/brass-compass/.venv/bin/python" ]; then
    echo "🔗 Python Ref:  http://localhost:6276"
fi
echo "--------------------------------------------------------"
echo -e "Press [Ctrl+C] to stop all services simultaneously.\n"

# Keep the shell session alive to process job traps
wait
