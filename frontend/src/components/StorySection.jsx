import { useState } from "react";
import { generateStory } from "../api";

const OPTION_KEYS = ["a", "b", "c", "d"];

export default function StorySection() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [story, setStory] = useState(null);
  const [questions, setQuestions] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  async function handleGenerate() {
    setError(null);
    setLoading(true);
    setStory(null);
    setQuestions(null);
    setAnswers({});
    setSubmitted(false);
    try {
      const result = await generateStory();
      setStory(result.story);
      setQuestions(result.questions);
    } catch (err) {
      setError(err.message || "Failed to generate a story.");
    } finally {
      setLoading(false);
    }
  }

  function selectAnswer(questionIndex, optionKey) {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionIndex]: optionKey }));
  }

  function handleSubmitAnswers() {
    setSubmitted(true);
  }

  const score = questions
    ? questions.reduce(
        (acc, q, i) => acc + (answers[i] === q.correct_answer ? 1 : 0),
        0
      )
    : 0;

  const allAnswered =
    questions && questions.every((_, i) => answers[i] !== undefined);

  return (
    <div className="space-y-6">
      {!story && (
        <div className="flex justify-center">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="bg-indigo-600 text-white px-6 py-3 rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Generating your story..." : "Generate Story"}
          </button>
        </div>
      )}

      {error && (
        <p className="text-center text-sm text-red-600">{error}</p>
      )}

      {story && (
        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
          <p className="text-lg leading-relaxed text-gray-900 whitespace-pre-wrap">
            {story}
          </p>
        </div>
      )}

      {questions && (
        <div className="space-y-5">
          {submitted && (
            <div className="text-center">
              <p className="text-xl font-semibold text-gray-900">
                You got {score}/{questions.length} correct
              </p>
            </div>
          )}

          {questions.map((q, i) => {
            const selected = answers[i];
            return (
              <div
                key={i}
                className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-3"
              >
                <p className="font-medium text-gray-900">
                  {i + 1}. {q.question}
                </p>
                <div className="space-y-2">
                  {OPTION_KEYS.map((key) => {
                    const isSelected = selected === key;
                    const isCorrect = q.correct_answer === key;
                    let stateClasses = "border-gray-300";
                    if (submitted) {
                      if (isCorrect) {
                        stateClasses = "border-green-500 bg-green-50";
                      } else if (isSelected && !isCorrect) {
                        stateClasses = "border-red-500 bg-red-50";
                      }
                    } else if (isSelected) {
                      stateClasses = "border-indigo-500 bg-indigo-50";
                    }
                    return (
                      <label
                        key={key}
                        className={`flex items-center gap-3 border rounded-md px-3 py-2 cursor-pointer ${stateClasses}`}
                      >
                        <input
                          type="radio"
                          name={`question-${i}`}
                          checked={isSelected || false}
                          onChange={() => selectAnswer(i, key)}
                          disabled={submitted}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-800">
                          <span className="font-medium uppercase mr-1">
                            {key})
                          </span>
                          {q.options[key]}
                        </span>
                      </label>
                    );
                  })}
                </div>
                {submitted && (
                  <p
                    className={`text-sm font-medium ${
                      selected === q.correct_answer
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {selected === q.correct_answer
                      ? "Correct!"
                      : `Incorrect — correct answer: ${q.correct_answer.toUpperCase()}) ${
                          q.options[q.correct_answer]
                        }`}
                  </p>
                )}
              </div>
            );
          })}

          <div className="flex justify-center gap-4">
            {!submitted && (
              <button
                onClick={handleSubmitAnswers}
                disabled={!allAnswered}
                className="bg-indigo-600 text-white px-6 py-3 rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                Submit Answers
              </button>
            )}
            <button
              onClick={handleGenerate}
              disabled={loading}
              className={
                submitted
                  ? "bg-indigo-600 text-white px-6 py-3 rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50"
                  : "border border-gray-300 text-gray-700 px-6 py-3 rounded-md font-medium hover:bg-gray-100 disabled:opacity-50"
              }
            >
              {loading ? "Generating..." : "Generate Another Story"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
