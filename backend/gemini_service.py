import os
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
client = None
if GEMINI_API_KEY and GEMINI_API_KEY != 'your_api_key_here':
    client = genai.Client(api_key=GEMINI_API_KEY)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROMPT_PATH = os.path.join(BASE_DIR, 'prompts', 'system_prompt.txt')

def get_system_prompt():
    try:
        with open(PROMPT_PATH, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception:
        return "You are a professional IT helpdesk assistant. Provide clear troubleshooting steps."

def get_gemini_response(user_message):
    try:
        if not client:
            return "AI service is currently unavailable. Please verify API configurations."
            
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=user_message,
            config=types.GenerateContentConfig(
                system_instruction=get_system_prompt(),
            )
        )
        return response.text
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Gemini API Error: {e}")
        return "UNRESOLVED"

def get_chatpro_response(user_message, file_path=None, history=None):
    try:
        if not client:
            return "AI service is currently unavailable. Please verify API configurations."
            
        content_parts = []
        
        history_text = ""
        if history and isinstance(history, list) and len(history) > 0:
            history_text = "--- Previous Conversation Context ---\n"
            for msg in history[-10:]: # keep last 10 messages for context window
                role = "User" if msg.get("sender") == "user" else "ChatPro"
                history_text += f"{role}: {msg.get('text', '')}\n\n"
            history_text += "--- End of Context ---\n\n"
            
        uploaded_file = None
        if file_path:
            # Upload the file to Gemini using the new SDK
            print(f"Uploading {file_path} to Gemini...")
            uploaded_file = client.files.upload(file=file_path)
            content_parts.append(uploaded_file)
            
        full_message = history_text + user_message
        if full_message:
            content_parts.append(full_message)
            
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=content_parts,
            config=types.GenerateContentConfig(
                system_instruction="You are ChatPro, an advanced, highly capable general AI assistant. You help users with coding, analysis, creative writing, research, and any general topics."
            )
        )
        
        # We delete the file immediately after getting the response as per instructions
        if uploaded_file:
            client.files.delete(name=uploaded_file.name)
            print(f"Deleted {uploaded_file.name} from Gemini storage.")
            
        return response.text
    except Exception as e:
        print(f"ChatPro Error: {e}")
        return f"An error occurred: {str(e)}"
