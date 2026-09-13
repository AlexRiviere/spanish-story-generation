import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from pydantic import BaseModel

DB_PATH = Path(__file__).parent / "data" / "app.db"


class ProfileIn(BaseModel):
    level: str
    interests: list[str]
    grammar_focus: list[str]


class ProfileOut(ProfileIn):
    updated_at: str


def _get_conn() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS profile (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            level TEXT NOT NULL,
            interests TEXT NOT NULL,
            grammar_focus TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
        """
    )
    return conn


def get_profile() -> Optional[ProfileOut]:
    conn = _get_conn()
    try:
        row = conn.execute(
            "SELECT level, interests, grammar_focus, updated_at FROM profile WHERE id = 1"
        ).fetchone()
        if row is None:
            return None
        level, interests, grammar_focus, updated_at = row
        return ProfileOut(
            level=level,
            interests=json.loads(interests),
            grammar_focus=json.loads(grammar_focus),
            updated_at=updated_at,
        )
    finally:
        conn.close()


def save_profile(profile: ProfileIn) -> ProfileOut:
    conn = _get_conn()
    try:
        updated_at = datetime.now(timezone.utc).isoformat()
        conn.execute(
            """
            INSERT INTO profile (id, level, interests, grammar_focus, updated_at)
            VALUES (1, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                level = excluded.level,
                interests = excluded.interests,
                grammar_focus = excluded.grammar_focus,
                updated_at = excluded.updated_at
            """,
            (
                profile.level,
                json.dumps(profile.interests),
                json.dumps(profile.grammar_focus),
                updated_at,
            ),
        )
        conn.commit()
        return ProfileOut(
            level=profile.level,
            interests=profile.interests,
            grammar_focus=profile.grammar_focus,
            updated_at=updated_at,
        )
    finally:
        conn.close()
