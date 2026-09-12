import { useState } from "react";
import { saveProfile, uploadNotes } from "../api";

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

function toList(text) {
  return text
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function ProfileForm({ initialProfile, onSaved, onCancel }) {
  const [level, setLevel] = useState(initialProfile?.level || "A1");
  const [interests, setInterests] = useState(
    (initialProfile?.interests || []).join(", ")
  );
  const [grammarFocus, setGrammarFocus] = useState(
    (initialProfile?.grammar_focus || []).join(", ")
  );
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const profile = await saveProfile({
        level,
        interests: toList(interests),
        grammar_focus: toList(grammarFocus),
      });
      if (file) {
        await uploadNotes(file);
      }
      onSaved(profile);
    } catch (err) {
      setError(err.message || "Something went wrong saving your profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-5"
    >
      <h2 className="text-xl font-semibold text-gray-900">
        {initialProfile ? "Edit your profile" : "Set up your profile"}
      </h2>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Level
        </label>
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {LEVELS.map((lvl) => (
            <option key={lvl} value={lvl}>
              {lvl}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Interests
        </label>
        <input
          type="text"
          value={interests}
          onChange={(e) => setInterests(e.target.value)}
          placeholder="cooking, travel, soccer"
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <p className="text-xs text-gray-500 mt-1">Comma-separated</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Grammar focus
        </label>
        <input
          type="text"
          value={grammarFocus}
          onChange={(e) => setGrammarFocus(e.target.value)}
          placeholder="preterite vs imperfect, subjunctive"
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <p className="text-xs text-gray-500 mt-1">Comma-separated</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes upload
        </label>
        <input
          type="file"
          accept=".txt"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block w-full text-sm text-gray-700 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
        />
        <p className="text-xs text-gray-500 mt-1">
          Upload your tutor notes or vocabulary lists
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Profile"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-md font-medium text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
