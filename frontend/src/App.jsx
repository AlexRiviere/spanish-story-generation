import { useEffect, useState } from "react";
import { getProfile, getNotesStatus } from "./api";
import ProfileForm from "./components/ProfileForm";
import ProfileSummary from "./components/ProfileSummary";
import StorySection from "./components/StorySection";

export default function App() {
  const [profile, setProfile] = useState(null);
  const [chunkCount, setChunkCount] = useState(0);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notesWarning, setNotesWarning] = useState(null);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const profileData = await getProfile();
      setProfile(profileData);
    } catch (err) {
      setError(err.message || "Failed to load app state.");
      setLoading(false);
      return;
    }

    try {
      const notesData = await getNotesStatus();
      setChunkCount(notesData.chunk_count);
    } catch (err) {
      setNotesWarning("Could not load note status.");
      setChunkCount(0);
    }

    setLoading(false);
  }

  function handleProfileSaved(savedProfile, warning) {
    setProfile(savedProfile);
    setEditing(false);
    setNotesWarning(warning || null);
    getNotesStatus()
      .then((data) => setChunkCount(data.chunk_count))
      .catch(() => {});
  }

  function handleNotesCleared() {
    setChunkCount(0);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
        <header>
          <h1 className="text-3xl font-bold text-gray-900">
            Spanish Story Generator
          </h1>
          <p className="text-gray-600 mt-1">
            Personalized reading practice, tailored to your level.
          </p>
        </header>

        {loading && <p className="text-gray-500">Loading...</p>}

        {!loading && error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-center justify-between gap-4">
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={loadAll}
              className="text-sm font-medium text-red-700 underline whitespace-nowrap"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && (!profile || editing) && (
          <ProfileForm
            initialProfile={editing ? profile : null}
            onSaved={handleProfileSaved}
            onCancel={profile ? () => setEditing(false) : undefined}
          />
        )}

        {!loading && profile && !editing && (
          <ProfileSummary
            profile={profile}
            chunkCount={chunkCount}
            onEdit={() => setEditing(true)}
            onNotesCleared={handleNotesCleared}
            warning={notesWarning}
            onDismissWarning={() => setNotesWarning(null)}
          />
        )}

        {!loading && profile && !editing && (
          <section>
            <StorySection />
          </section>
        )}

        {!loading && !profile && !editing && (
          <p className="text-center text-gray-500">
            Save your profile above to generate a story
          </p>
        )}
      </div>
    </div>
  );
}
