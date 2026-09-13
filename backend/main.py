import os
import random

import anyio
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from openai import (
    APIConnectionError,
    AuthenticationError,
    OpenAI,
    OpenAIError,
    RateLimitError,
)

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

MAX_NOTES_UPLOAD_BYTES = 10 * 1024 * 1024  # 10 MB

_openai_client: OpenAI | None = None


def get_openai_client() -> OpenAI:
    global _openai_client
    if _openai_client is None:
        api_key = os.environ.get("OPENAI_API_KEY")
        if not api_key:
            raise HTTPException(
                status_code=500,
                detail=(
                    "No OpenAI API key is configured. Add OPENAI_API_KEY to "
                    "backend/.env, then restart the backend server."
                ),
            )
        _openai_client = OpenAI(api_key=api_key)
    return _openai_client


def openai_error_detail(exc: Exception) -> str:
    if isinstance(exc, AuthenticationError):
        return (
            "OpenAI rejected the configured API key. Check that "
            "OPENAI_API_KEY in backend/.env is correct, then restart the "
            "backend server."
        )
    if isinstance(exc, RateLimitError):
        return (
            "OpenAI rate limit or quota exceeded. Check your OpenAI account "
            "usage/billing, then try again in a moment."
        )
    if isinstance(exc, APIConnectionError):
        return (
            "Could not reach the OpenAI API. Check your internet connection "
            "and try again."
        )
    if isinstance(exc, OpenAIError):
        return f"OpenAI API error: {exc}"
    return f"Unexpected error: {exc}"


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
    if not file.filename or not file.filename.lower().endswith(".txt"):
        raise HTTPException(
            status_code=400,
            detail=(
                f'"{file.filename or "unnamed file"}" is not a .txt file. '
                "Please upload a plain text (.txt) file."
            ),
        )

    raw = await file.read(MAX_NOTES_UPLOAD_BYTES + 1)
    if len(raw) > MAX_NOTES_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail=(
                f'"{file.filename}" is too large. Please upload a file '
                f"under {MAX_NOTES_UPLOAD_BYTES // (1024 * 1024)} MB."
            ),
        )
    if not raw:
        raise HTTPException(
            status_code=400,
            detail=f'"{file.filename}" is empty. Please upload a file that contains text.',
        )
    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError:
        raise HTTPException(
            status_code=400,
            detail=(
                f'"{file.filename}" could not be read as UTF-8 text. Please '
                "save the file with UTF-8 encoding and try again."
            ),
        )

    if not text.strip():
        raise HTTPException(
            status_code=400,
            detail=f'"{file.filename}" doesn\'t contain any readable text.',
        )

    client = get_openai_client()
    try:
        added = await anyio.to_thread.run_sync(embeddings.add_notes, client, text)
    except OpenAIError as exc:
        raise HTTPException(status_code=502, detail=openai_error_detail(exc))
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

    try:
        note_chunks = (
            embeddings.query_notes(client, query, n_results=5) if query.strip() else []
        )
        result = generator.generate_story(
            client,
            level=profile.level,
            interest=chosen_interest,
            grammar_focus=profile.grammar_focus,
            note_chunks=note_chunks,
        )
    except OpenAIError as exc:
        raise HTTPException(status_code=502, detail=openai_error_detail(exc))
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail="Story generation failed unexpectedly",
        )

    return result
