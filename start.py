import subprocess
import sys
import os
import time
import signal

def run_sync():
    """Run the database sync script before starting services."""
    print("--- [1/3] Synchronizing Database ---")
    try:
        subprocess.run([sys.executable, "sync_db.py"], check=True)
    except subprocess.CalledProcessError as e:
        print(f"Error during database sync: {e}")
        sys.exit(1)

def start_services():
    """Start Backend and Frontend services in parallel."""
    print("\n--- [2/3] Launching Backend Server ---")
    # Backend runs from root
    backend_proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--reload"],
        cwd=os.getcwd()
    )

    print("\n--- [3/3] Launching Frontend Dev Server ---")
    # Frontend runs from frontend directory
    frontend_dir = os.path.join(os.getcwd(), "frontend")
    
    # Use 'npm.cmd' on Windows, 'npm' on other platforms
    npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
    
    frontend_proc = subprocess.Popen(
        [npm_cmd, "run", "dev"],
        cwd=frontend_dir
    )

    print("\n" + "="*40)
    print(" RentFlow Services are starting!")
    print(f" - Backend: http://127.0.0.1:8000")
    print(f" - Frontend: (Check terminal output for port, usually 5173)")
    print("="*40 + "\n")

    try:
        # Keep the script running while services are active
        while True:
            time.sleep(1)
            # Check if processes are still alive
            if backend_proc.poll() is not None:
                print("Backend process terminated unexpectedly.")
                break
            if frontend_proc.poll() is not None:
                print("Frontend process terminated unexpectedly.")
                break
    except KeyboardInterrupt:
        print("\nShutting down services...")
        backend_proc.terminate()
        frontend_proc.terminate()
        print("Done.")

if __name__ == "__main__":
    # Ensure we are in the project root
    if not os.path.exists("app") or not os.path.exists("frontend"):
        print("Error: Please run this script from the project root directory.")
        sys.exit(1)
        
    run_sync()
    start_services()
