# Spanish Story Generator

A single-user Spanish learning app. Set a CEFR level, interests, and grammar
focus points, optionally upload your own notes/vocab lists, and generate
short stories in Spanish calibrated to your profile — with comprehension
questions to check yourself.

## How it works

- Your profile (level, interests, grammar focus) is stored locally in SQLite.
- Optional `.txt` notes you upload get chunked, embedded, and stored in a
  local ChromaDB vector store, so generated stories can naturally pull in
  your own vocab and material.
- Story + comprehension questions are generated together in a single
  structured-output call to OpenAI's `gpt-4o-mini`.

## Tech stack

- **Backend**: Python, FastAPI, SQLite, ChromaDB (local, no server)
- **Embeddings**: OpenAI `text-embedding-3-small`
- **Generation**: OpenAI `gpt-4o-mini`, structured JSON output
- **Frontend**: React + Tailwind

## Setup

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate       # on Windows (native, no WSL): .venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in `backend/`:

```
OPENAI_API_KEY=your_key_here
```

Run it:

```bash
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

## API routes

| Method | Route | Description |
|---|---|---|
| GET | `/profile` | Fetch current profile (or null if unset) |
| POST | `/profile` | Create or update profile |
| GET | `/notes/status` | Chunk count currently stored |
| POST | `/notes` | Upload a `.txt` file — chunks, embeds, and appends |
| DELETE | `/notes` | Clear all stored chunks |
| POST | `/generate` | Generate a story + 5 comprehension questions |

## Notes

- Notes are additive — uploading a new file appends to existing chunks
  rather than replacing them. Use `DELETE /notes` to start fresh.
- Story generation works with zero notes stored; notes context is optional,
  not required.