import sys
import os

# Ensure backend module can be imported properly
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from flask import Flask
from flask_cors import CORS
from routes import setup_routes

app = Flask(__name__)
# Enable CORS for frontend requests
CORS(app)

# Configure Upload Folder for ChatPro Temporary files
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

setup_routes(app)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
