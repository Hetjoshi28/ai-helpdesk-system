import os
from google import genai

keys = [
    "AIzaSyBbwf6CdQSDWTveUQH4fDgp9DeJ6tBNW2I",
    "AIzaSyB8iSSknmMCcX0NGz_RQLtYj-wv7RboZ44"
]

for key in keys:
    print(f"\nTesting key: {key[:10]}...")
    try:
        client = genai.Client(api_key=key)
        resp = client.models.generate_content(
            model='gemini-2.5-flash',
            contents='Return the word SUCCESS'
        )
        print("Result:", resp.text)
    except Exception as e:
        print("Error:", str(e))
