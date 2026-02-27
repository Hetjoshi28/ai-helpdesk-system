import os
import json
from flask import request, jsonify, current_app
from werkzeug.utils import secure_filename
from chatbot_engine import process_message
from gemini_service import get_chatpro_response

def setup_routes(app):
    @app.route('/', methods=['GET'])
    def index():
        return "Helpdesk AI running successfully", 200

    @app.route('/api/chat', methods=['POST'])
    def chat():
        data = request.get_json()
        if not data or 'message' not in data:
            return jsonify({'error': 'Invalid request, "message" is required.'}), 400
        
        user_message = data['message']
        reply = process_message(user_message)
        
        return jsonify({'reply': reply}), 200

    @app.route('/api/chatpro', methods=['POST'])
    def chatpro():
        # Handle form-data (message + optional file + history)
        message = request.form.get('message', '')
        history_str = request.form.get('history', '[]')
        
        try:
            history = json.loads(history_str)
        except Exception:
            history = []
            
        file = request.files.get('file')
        file_path = None
        
        if file and file.filename != '':
            filename = secure_filename(file.filename)
            file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)
            
        try:
            # Send to Gemini
            reply = get_chatpro_response(message, file_path, history)
            return jsonify({'reply': reply}), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500
        finally:
            # Clean up temporary file
            if file_path and os.path.exists(file_path):
                try:
                    os.remove(file_path)
                except Exception as cleanup_error:
                    print(f"Cleanup error: {cleanup_error}")
