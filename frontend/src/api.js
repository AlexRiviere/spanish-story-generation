const BASE_URL = "http://localhost:8000";

function extractDetail(data, fallback) {
  const detail = data?.detail;
  if (!detail) return fallback;
  if (typeof detail === "string") return detail;
  // FastAPI/Pydantic validation errors come back as a list of {msg, loc} objects.
  if (Array.isArray(detail)) {
    return detail
      .map((d) => (typeof d === "string" ? d : d.msg || JSON.stringify(d)))
      .join("; ");
  }
  return fallback;
}

async function handleResponse(res) {
  if (!res.ok) {
    let detail = `Request failed (${res.status} ${res.statusText})`;
    try {
      const data = await res.json();
      detail = extractDetail(data, detail);
    } catch {
      // response body wasn't JSON; keep the status-based fallback
    }
    throw new Error(detail);
  }
  return res.json();
}

async function apiFetch(path, options) {
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, options);
  } catch {
    throw new Error(
      `Cannot reach the backend at ${BASE_URL}. Make sure the backend server is running.`
    );
  }
  return handleResponse(res);
}

export async function getProfile() {
  return apiFetch("/profile");
}

export async function saveProfile(profile) {
  return apiFetch("/profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile),
  });
}

export async function getNotesStatus() {
  return apiFetch("/notes/status");
}

export async function uploadNotes(file) {
  const formData = new FormData();
  formData.append("file", file);
  return apiFetch("/notes", {
    method: "POST",
    body: formData,
  });
}

export async function clearNotes() {
  return apiFetch("/notes", { method: "DELETE" });
}

export async function generateStory() {
  return apiFetch("/generate", { method: "POST" });
}
