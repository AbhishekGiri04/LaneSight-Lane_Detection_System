import subprocess
import time
import webbrowser
import requests
import os

print("🚀 Starting LaneSight...")

# Kill existing processes
subprocess.run(['pkill', '-f', 'uvicorn'], capture_output=True)
subprocess.run(['pkill', '-f', 'react-scripts'], capture_output=True)
time.sleep(1)

# Start backend
print("📡 Starting backend...")
backend = subprocess.Popen(['python', '-m', 'uvicorn', 'app:app', '--host', '0.0.0.0', '--port', '8000'], cwd='backend')

# Start frontend without auto-opening browser
print("🌐 Starting frontend...")
env = os.environ.copy()
env['BROWSER'] = 'none'
frontend = subprocess.Popen(['npm', 'start'], cwd='frontend', env=env)

# Wait for frontend to be ready
print("⏳ Waiting for services to start...")
time.sleep(8)

# Check if frontend is ready
for i in range(30):
    try:
        response = requests.get('http://localhost:3000', timeout=2)
        if response.status_code == 200:
            print("✅ Frontend ready!")
            break
    except:
        time.sleep(1)
        continue

# Open browser
webbrowser.open('http://localhost:3000')

# Keep frontend running
frontend.wait()