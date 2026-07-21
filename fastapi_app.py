from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from groq import Groq
from typing import Optional
from bson import ObjectId
from mongodb import chat_collection
import json
import base64
import os

from dotenv import load_dotenv
load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    raise Exception("GROQ_API_KEY not found in .env")

client = Groq(
    api_key=GROQ_API_KEY
)

# =====================================================
# FASTAPI APP
# =====================================================

app = FastAPI(
    title="Code-GPT Backend",
    version="3.0.0"
)


# =====================================================
# CORS
# =====================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =====================================================
# REQUEST MODEL
# =====================================================

class ChatRequest(BaseModel):
    chat_id: str
    prompt: str
    attachment: Optional[dict] = None


# =====================================================
# HELPER FUNCTIONS
# =====================================================
def image_to_base64(path: str):
    """
    Convert uploaded image to Base64.
    Used when sending images to Groq Vision models.
    """

    if not path:
        return None

    if not os.path.exists(path):
        return None

    try:
        with open(path, "rb") as f:
            return base64.b64encode(
                f.read()
            ).decode("utf-8")

    except Exception as e:
        print("Image conversion error:", e)
        return None


# =====================================================
# GET CHAT
# =====================================================

def get_chat(chat_id: str):

    try:

        return chat_collection.find_one(
            {
                "_id": ObjectId(chat_id)
            }
        )

    except Exception as e:

        print("Get chat error:", e)

        return None


# =====================================================
# SAVE MESSAGE
# =====================================================

def save_message(
    chat_id,
    role,
    content,
    attachment=None
):

    message = {

        "role": role,

        "content": content

    }

    if attachment:

        message["attachment"] = attachment

    try:

        result = chat_collection.update_one(

            {
                "_id": ObjectId(chat_id)
            },

            {
                "$push": {
                    "messages": message
                }
            }

        )

        print(
            "Matched:",
            result.matched_count
        )

        print(
            "Modified:",
            result.modified_count
        )

    except Exception as e:

        print("Save message error:", e)


# =====================================================
# CREATE CONVERSATION
# =====================================================

def create_conversation(
    system_prompt,
    history
):

    conversation = [

        {
            "role": "system",
            "content": system_prompt
        }

    ]

    for msg in history:

        if "role" not in msg:

            continue

        if "content" not in msg:

            continue

        conversation.append(

            {
                "role": msg["role"],
                "content": msg["content"]
            }

        )

    return conversation





SYSTEM_PROMPT = """
You are Code-GPT.

You are an expert programming assistant.

Rules:

1. Answer like ChatGPT.

2. Explain before code.

3. Keep answers concise unless asked.

4. Always format code using markdown.

5. Produce production-quality code.

6. Remember previous conversation.

7. If image is uploaded,
   analyse the image before answering.

8. Prefer:
   Python
   FastAPI
   Django
   JavaScript
   React
   SQL

9. Use headings and bullet points.

10. Never output raw code without markdown.
"""
def build_image_message(prompt, image_path):

    image_base64 = image_to_base64(image_path)

    if not image_base64:

        return {

            "role": "user",

            "content": prompt

        }

    return {

        "role": "user",

        "content": [

            {

                "type": "text",

                "text": prompt

            },

            {

                "type": "image_url",

                "image_url": {

                    "url": f"data:image/jpeg;base64,{image_base64}"

                }

            }

        ]

    }
# =====================================================
# CHAT API
# =====================================================
@app.post("/chat")
async def chat(request: ChatRequest):
    # ---------------------------------
    # Fetch Chat
    # ---------------------------------

    chat_doc = get_chat(request.chat_id)

    if not chat_doc:

        return {
            "error": "Chat not found"
        }


    # ---------------------------------
    # Update title for first message
    # ---------------------------------

    if chat_doc["title"] == "New Chat":

        chat_collection.update_one(
            {
                "_id": ObjectId(request.chat_id)
            },
            {
                "$set": {
                    "title": request.prompt[:30]
                }
            }
        )

    # ---------------------------------
    # Select Groq Model
    # ---------------------------------

    groq_model = "llama-3.3-70b-versatile"

    if (
        request.attachment
        and request.attachment.get(
            "type", ""
        ).startswith("image/")
    ):

        # Vision Model

        groq_model = "qwen/qwen3.6-27b"  


    # ---------------------------------
    # Previous history
    # ---------------------------------
    conversation = create_conversation(
    SYSTEM_PROMPT,
    chat_doc.get("messages", [])
    )
     

    # ---------------------------------
    # Current user message
    # ---------------------------------

    if request.attachment:

        user_message = build_image_message(

            request.prompt,

            request.attachment.get("path")

        )

    else:

        user_message = {

            "role": "user",

            "content": request.prompt

        }


    conversation.append(user_message)

    

    save_message(
    request.chat_id,
    "user",
    request.prompt,
    request.attachment
)

    print("=" * 60)
    print("MODEL :", groq_model)
    print("PROMPT:", request.prompt)

    if request.attachment:
        print("IMAGE :", request.attachment.get("path"))

    print("=" * 60)

        # ---------------------------------
    # Send Request to Groq
    # ---------------------------------

    try:

        stream = client.chat.completions.create(

            model=groq_model,

            messages=conversation,

            temperature=0.1,

            top_p=0.9,

            stream=True

        )

    except Exception as e:

        return {

            "error": str(e)

        }


    # =====================================================
    # STREAM RESPONSE
    # =====================================================

    def generate():

        full_response = ""

        try:

            for chunk in stream:

                if not chunk.choices:

                    continue

                delta = chunk.choices[0].delta

                if delta.content:

                    full_response += delta.content

                    yield delta.content

        except Exception as e:

            yield f"\n\nError : {str(e)}"

        finally:

            save_message(

                request.chat_id,

                "assistant",

                full_response

            )


    return StreamingResponse(

        generate(),

        media_type="text/plain"

    )


# =====================================================
# CREATE NEW CHAT
# =====================================================

@app.post("/new-chat")
def new_chat():

    chat = {
        "title": "New Chat",
        "messages": []
    }

    result = chat_collection.insert_one(chat)

    return {
        "chat_id": str(result.inserted_id)
    }


# =====================================================
# GET ALL CHATS
# =====================================================

@app.get("/chats")
async def get_chats():

    chats = list(

        chat_collection.find({}, {"title":1}).sort("_id", -1)
    )

    output = []

    for chat in chats:

        output.append({

            "_id": str(chat["_id"]),

            "title": chat["title"]

        })

    return output


# =====================================================
# GET CHAT
# =====================================================

@app.get("/chat/{chat_id}")
async def open_chat(chat_id: str):

    chat = get_chat(chat_id)

    if not chat:

        return {

            "messages": []

        }

    chat["_id"] = str(chat["_id"])

    return chat


# =====================================================
# DELETE CHAT
# =====================================================

@app.delete("/chat/{chat_id}")
async def delete_chat(chat_id: str):

    try:

        chat_collection.delete_one(

            {

                "_id": ObjectId(chat_id)

            }

        )

        return {

            "message": "Deleted Successfully"

        }

    except Exception as e:

        return {

            "error": str(e)

        }  