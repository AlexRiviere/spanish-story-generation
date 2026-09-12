import os
import random

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI

import embeddings
import generator
import profile as profile_store
from profile import ProfileIn, ProfileOut

load_dotenv()

app = FastAPI(title="Spanish Story Generator")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_openai_client: OpenAI | None = None


def get_openai_client() -> OpenAI:
    global _openai_client
    if _openai_client is None:
        api_key = os.environ.get("OPENAI_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="OPENAI_API_KEY is not set")
        _openai_client = OpenAI(api_key=api_key)
    return _openai_client


@app.get("/profile")
def get_profile() -> ProfileOut | None:
    return profile_store.get_profile()


@app.post("/profile")
def save_profile(profile: ProfileIn) -> ProfileOut:
    return profile_store.save_profile(profile)


@app.get("/notes/status")
def notes_status():
    return {"chunk_count": embeddings.get_chunk_count()}


@app.post("/notes")
async def upload_notes(file: UploadFile):
    if not file.filename.endswith(".txt"):
        raise HTTPException(status_code=400, detail="Only .txt files are accepted")

    raw = await file.read()
    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="File must be UTF-8 encoded text")

    client = get_openai_client()
    added = embeddings.add_notes(client, text)
    return {"chunks_added": added, "total_chunks": embeddings.get_chunk_count()}


@app.delete("/notes")
def clear_notes():
    embeddings.clear_notes()
    return {"chunk_count": embeddings.get_chunk_count()}


@app.post("/generate")
def generate():
    profile = profile_store.get_profile()
    if profile is None:
        raise HTTPException(status_code=400, detail="Profile not set. Please create a profile first.")

    client = get_openai_client()

    chosen_interest = random.choice(profile.interests) if profile.interests else None
    query_terms = profile.grammar_focus + ([chosen_interest] if chosen_interest else [])
    query = " ".join(query_terms)
    note_chunks = embeddings.query_notes(client, query, n_results=5) if query.strip() else []

    try:
        result = generator.generate_story(
            client,
            level=profile.level,
            interest=chosen_interest,
            grammar_focus=profile.grammar_focus,
            note_chunks=note_chunks,
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Story generation failed: {exc}")

    return result
