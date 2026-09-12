import json

from openai import OpenAI
from pydantic import BaseModel

MODEL = "gpt-4o-mini"


class QuestionOptions(BaseModel):
    a: str
    b: str
    c: str
    d: str


class Question(BaseModel):
    question: str
    options: QuestionOptions
    correct_answer: str


class StoryResponse(BaseModel):
    story: str
    questions: list[Question]


RESPONSE_SCHEMA = {
    "type": "json_schema",
    "json_schema": {
        "name": "story_response",
        "strict": True,
        "schema": {
            "type": "object",
            "properties": {
                "story": {"type": "string"},
                "questions": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "question": {"type": "string"},
                            "options": {
                                "type": "object",
                                "properties": {
                                    "a": {"type": "string"},
                                    "b": {"type": "string"},
                                    "c": {"type": "string"},
                                    "d": {"type": "string"},
                                },
                                "required": ["a", "b", "c", "d"],
                                "additionalProperties": False,
                            },
                            "correct_answer": {
                                "type": "string",
                                "enum": ["a", "b", "c", "d"],
                            },
                        },
                        "required": ["question", "options", "correct_answer"],
                        "additionalProperties": False,
                    },
                    "minItems": 5,
                    "maxItems": 5,
                },
            },
            "required": ["story", "questions"],
            "additionalProperties": False,
        },
    },
}


def build_prompt(level: str, interest: str | None, grammar_focus: list[str], note_chunks: list[str]) -> str:
    interest_text = interest if interest else "temas generales"
    grammar_str = ", ".join(grammar_focus) if grammar_focus else "gramática general"

    notes_section = ""
    if note_chunks:
        joined_notes = "\n---\n".join(note_chunks)
        notes_section = (
            "\n\nUsa el siguiente contexto de los apuntes del estudiante como referencia. "
            "Incorpora vocabulario o conceptos relevantes de estos apuntes de forma natural "
            "cuando encajen en la historia:\n"
            f"{joined_notes}\n"
        )

    return f"""Eres un profesor de español que crea material de lectura para estudiantes.

Escribe una historia en español de entre 200 y 300 palabras para un estudiante de nivel CEFR {level}.

Requisitos:
- El nivel de vocabulario y complejidad gramatical debe corresponder al nivel {level}.
- Incorpora de forma natural los siguientes puntos gramaticales: {grammar_str}.
- El tema o ambientación de la historia debe reflejar este interés: {interest_text}.
{notes_section}
Después de la historia, genera exactamente 5 preguntas de comprensión de lectura en español, \
cada una con 4 opciones (a, b, c, d) y un campo correct_answer que indique la opción correcta \
("a", "b", "c" o "d"). Las preguntas deben evaluar la comprensión del contenido de la historia o preguntar sobre temas gramaticales."""


def generate_story(
    client: OpenAI,
    level: str,
    interest: str | None,
    grammar_focus: list[str],
    note_chunks: list[str],
) -> StoryResponse:
    prompt = build_prompt(level, interest, grammar_focus, note_chunks)

    completion = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        response_format=RESPONSE_SCHEMA,
    )

    content = completion.choices[0].message.content
    data = json.loads(content)
    return StoryResponse(**data)
