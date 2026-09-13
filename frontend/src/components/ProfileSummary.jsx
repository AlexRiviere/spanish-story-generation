import { useState } from "react";
import { clearNotes } from "../api";

export default function ProfileSummary({
  profile,
  chunkCount,
  onEdit,
  onNotesCleared,
  warning,
  onDismissWarning,
}) {
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState(null);

  async function handleClear() {
    if (!window.confirm("Clear all stored notes? This can't be undone.")) {
      return;
    }
    setError(null);
    setClearing(true);
    try {
      await clearNotes();
      onNotesCleared();
    } catch (err) {
      setError(
        err.message || "Failed to clear notes. Please try again."
      );
    } finally {
      setClearing(false);
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
      {warning && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 flex items-start justify-between gap-4">
          <p className="text-sm text-yellow-800">{warning}</p>
          <button
            onClick={onDismissWarning}
            className="text-sm font-medium text-yellow-800 underline whitespace-nowrap"
          >
            Dismiss
          </button>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-sm font-semibold">
            {profile.level}
          </span>
          <h2 className="text-lg font-semibold text-gray-900">Your Profile</h2>
        </div>
        <button
          onClick={onEdit}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
        >
          Edit
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-500 font-medium">Interests</p>
          <p className="text-gray-900">
            {profile.interests.length ? profile.interests.join(", ") : "—"}
          </p>
        </div>
        <div>
          <p className="text-gray-500 font-medium">Grammar focus</p>
          <p className="text-gray-900">
            {profile.grammar_focus.length ? profile.grammar_focus.join(", ") : "—"}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <p className="text-sm text-gray-600">{chunkCount} chunks stored</p>
        <button
          onClick={handleClear}
          disabled={clearing || chunkCount === 0}
          className="text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-50 disabled:hover:text-red-600"
        >
          {clearing ? "Clearing..." : "Clear Notes"}
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
