const BASE_URL = "http://localhost:8000";

async function handleResponse(res) {
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const data = await res.json();
      detail = data.detail || detail;
    } catch {
      // ignore json parse errors
    }
    throw new Error(detail);
  }
  return res.json();
}

export async function getProfile() {
  const res = await fetch(`${BASE_URL}/profile`);
  return handleResponse(res);
}

export async function saveProfile(profile) {
  const res = await fetch(`${BASE_URL}/profile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile),
  });
  return handleResponse(res);
}

export async function getNotesStatus() {
  const res = await fetch(`${BASE_URL}/notes/status`);
  return handleResponse(res);
}

export async function uploadNotes(file) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${BASE_URL}/notes`, {
    method: "POST",
    body: formData,
  });
  return handleResponse(res);
}

export async function clearNotes() {
  const res = await fetch(`${BASE_URL}/notes`, { method: "DELETE" });
  return handleResponse(res);
}

export async function generateStory() {
  const res = await fetch(`${BASE_URL}/generate`, { method: "POST" });
  return handleResponse(res);
}
