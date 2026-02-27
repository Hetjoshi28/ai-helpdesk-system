#!/bin/bash
cd "$(dirname "$0")"

echo "================================================="
echo "   Starting IT Helpdesk AI (Robust Mode) 🚀"
echo "================================================="
echo ""

# Kill existing development servers if any exist to clear ports
echo "[1/3] Clearing old stagnant sessions..."
pkill -f "python3 -m http.server 8001" >/dev/null 2>&1 || true
pkill -f "backend/app.py" >/dev/null 2>&1 || true
pkill -f "waitress" >/dev/null 2>&1 || true

sleep 1

# Start Backend using reliable WSGI server (Waitress)
echo "[2/3] Booting AI Backend (Waitress WSGI)..."
cd backend
../venv/bin/waitress-serve --port=5001 app:app &
cd ..

# Start Frontend Server
echo "[3/3] Booting UI Dashboard..."
cd frontend
python3 -m http.server 8001 >/dev/null 2>&1 &
FRONTEND_PID=$!
cd ..

echo ""
echo "================================================="
echo " ✅ ONLINE AND PROTECTED AGAINST SLEEP TIMEOUTS!"
echo " 👉 Click here to open: http://localhost:8001/"
echo "================================================="
echo " (Leave this window open. Press Ctrl+C to stop the UI server)"

wait $FRONTEND_PID
