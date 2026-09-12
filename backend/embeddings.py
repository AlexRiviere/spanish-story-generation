from pathlib import Path

import chromadb
from openai import OpenAI

CHROMA_PATH = Path(__file__).parent / "data" / "chroma"
COLLECTION_NAME = "notes"
EMBEDDING_MODEL = "text-embedding-3-small"
CHUNK_SIZE = 300
CHUNK_OVERLAP = 50

_client = None
_collection = None


def _get_collection():
    global _client, _collection
    if _collection is None:
        CHROMA_PATH.mkdir(parents=True, exist_ok=True)
        _client = chromadb.PersistentClient(path=str(CHROMA_PATH))
        _collection = _client.get_or_create_collection(COLLECTION_NAME)
    return _collection


def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    text = text.strip()
    if not text:
        return []
    chunks = []
    start = 0
    step = chunk_size - overlap
    while start < len(text):
        chunk = text[start : start + chunk_size].strip()
        if chunk:
            chunks.append(chunk)
        start += step
    return chunks


def embed_chunks(client: OpenAI, chunks: list[str]) -> list[list[float]]:
    response = client.embeddings.create(model=EMBEDDING_MODEL, input=chunks)
    return [item.embedding for item in response.data]


def add_notes(client: OpenAI, text: str) -> int:
    collection = _get_collection()
    chunks = chunk_text(text)
    if not chunks:
        return 0
    embeddings = embed_chunks(client, chunks)
    existing_count = collection.count()
    ids = [f"chunk-{existing_count + i}" for i in range(len(chunks))]
    collection.add(ids=ids, documents=chunks, embeddings=embeddings)
    return len(chunks)


def get_chunk_count() -> int:
    collection = _get_collection()
    return collection.count()


def clear_notes():
    global _client, _collection
    _get_collection()
    # Chroma has no "delete all" primitive; drop and recreate the collection.
    _client.delete_collection(COLLECTION_NAME)
    _collection = _client.get_or_create_collection(COLLECTION_NAME)


def query_notes(client: OpenAI, query: str, n_results: int = 5) -> list[str]:
    collection = _get_collection()
    if collection.count() == 0:
        return []
    n_results = min(n_results, collection.count())
    query_embedding = embed_chunks(client, [query])[0]
    results = collection.query(query_embeddings=[query_embedding], n_results=n_results)
    documents = results.get("documents", [[]])
    return documents[0] if documents else []
