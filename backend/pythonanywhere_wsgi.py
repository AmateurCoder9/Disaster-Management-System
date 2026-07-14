# PythonAnywhere WSGI configuration file
# This file tells PythonAnywhere how to run your Flask app.
#
# SETUP INSTRUCTIONS (copy-paste into PythonAnywhere):
# 1. Go to https://www.pythonanywhere.com and create a FREE account (no card needed)
# 2. Go to the "Consoles" tab -> Start a new Bash console
# 3. Run these commands:
#      git clone https://github.com/AmateurCoder9/Disaster-Management-System.git
#      cd Disaster-Management-System/backend
#      pip install --user -r requirements.txt
#      python data/generate_synthetic_data.py
#      python app/ml/train_model.py
# 4. Go to the "Web" tab -> "Add a new web app"
#      - Choose "Manual configuration"
#      - Choose Python 3.10
# 5. In the "Code" section, set:
#      - Source code: /home/YOUR_USERNAME/Disaster-Management-System/backend
#      - Working directory: /home/YOUR_USERNAME/Disaster-Management-System/backend
# 6. Click the "WSGI configuration file" link and replace its content with:
#      (copy everything below the line)
# ─────────────────────────────────────────────────────────────────────

import sys
import os

# Add your project to the path
project_home = '/home/YOUR_USERNAME/Disaster-Management-System/backend'
if project_home not in sys.path:
    sys.path.insert(0, project_home)

# Set environment variables
os.environ['JWT_SECRET'] = 'change-this-to-a-real-secret'
os.environ['SEED_DB'] = 'true'
os.environ['CORS_ORIGINS'] = '*'

# Import and create the Flask app
from run import app as application  # noqa
