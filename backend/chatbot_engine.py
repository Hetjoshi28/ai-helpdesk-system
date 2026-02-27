import json
import os
from gemini_service import get_gemini_response
from ticket_system import create_ticket

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KB_PATH = os.path.join(BASE_DIR, 'data', 'knowledge_base.json')

def load_knowledge_base():
    try:
        with open(KB_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        return {}

def process_message(message):
    message_lower = message.lower()
    
    # 1. Check local knowledge base first
    kb = load_knowledge_base()
    for issue, solution in kb.items():
        if issue in message_lower:
            return solution
            
    # Fallback to creating a ticket ONLY if user explicitly requests one
    if any(keyword in message_lower for keyword in ["create ticket", "open a ticket", "raise a ticket"]):
        create_ticket(message)
        return "Ticket created. Our support team will contact you shortly."

    # 2. Otherwise call Gemini API for Helpdesk
    ai_response = get_gemini_response(message)
    
    if not ai_response:
        return "I'm having trouble connecting to my knowledge base right now. Please try again later."
        
    return ai_response
