import os
import subprocess
import sys

def start_bot():
    print("🚀 Starting Telegram Bot from server wrapper...")
    # Go up one directory to find bot.py
    bot_path = os.path.join(os.getcwd(), "..", "bot.py")
    if os.path.exists(bot_path):
        subprocess.Popen([sys.executable, bot_path], cwd=os.path.join(os.getcwd(), ".."))
        print("✅ Bot process started in background.")
    else:
        print(f"❌ Could not find bot.py at {bot_path}")

if __name__ == "__main__":
    start_bot()
