import { useEffect, useState } from 'react'
import { apiRequest } from '../services/api'

export default function QuestionAnswer({
  question,
  onEvaluationComplete,
}) {
  const [answerText, setAnswerText] = useState('')
  const [savedAnswer, setSavedAnswer] = useState(null)
  const [evaluation, setEvaluation] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingAnswer, setCheckingAnswer] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadExistingAnswer() {
      setCheckingAnswer(true)
      setError('')
      setSavedAnswer(null)
      setEvaluation(null)
      setAnswerText('')

      try {
        const answer = await apiRequest(
          `/answers/questions/${question.id}`
        )

        if (cancelled) return

        if (answer) {
          setSavedAnswer(answer)
          setAnswerText(answer.answer_text || '')

          const isEvaluated =
            answer.technical_score != null &&
            answer.communication_score != null &&
            answer.correctness_score != null &&
            answer.feedback != null

          if (isEvaluated) {
            setEvaluation(answer)
            onEvaluationComplete?.()
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message || 'Could not load the saved answer.'
          )
        }
      } finally {
        if (!cancelled) {
          setCheckingAnswer(false)
        }
      }
    }

    loadExistingAnswer()

    return () => {
      cancelled = true
    }
    }, [question.id, onEvaluationComplete])

  async function handleSubmit(event) {
    event.preventDefault()

    if (!answerText.trim()) {
      setError('Please write your answer before submitting.')
      return
    }

    setError('')
    setLoading(true)

    try {
      let answer = savedAnswer

      // Create an answer only if one does not already exist.
      if (!answer) {
        answer = await apiRequest(
          `/answers/questions/${question.id}`,
          {
            method: 'POST',
            body: JSON.stringify({
              answer_text: answerText.trim(),
            }),
          }
        )

        setSavedAnswer(answer)
      }

      // Evaluate the saved answer. The backend returns an existing
      // evaluation when the answer has already been evaluated.
      const result = await apiRequest(
        `/answers/${answer.id}/evaluate`,
        { method: 'POST' }
      )

      setSavedAnswer(result)
      setAnswerText(result.answer_text || answerText)
      setEvaluation(result)
      onEvaluationComplete?.()
    } catch (err) {
      setError(
        err.message || 'Could not submit or evaluate your answer.'
      )
    } finally {
      setLoading(false)
    }
  }

  const isEvaluated = Boolean(evaluation)

  return (
    <div className="mt-5 border-t border-slate-100 pt-5">
      <form onSubmit={handleSubmit}>
        <label
          htmlFor={`answer-${question.id}`}
          className="mb-2 block text-sm font-semibold text-slate-800"
        >
          Your answer
        </label>

        {checkingAnswer && (
          <p className="mb-3 text-sm text-slate-500">
            Checking for a saved answer...
          </p>
        )}

        <textarea
          id={`answer-${question.id}`}
          value={answerText}
          onChange={(event) => setAnswerText(event.target.value)}
          minLength={1}
          maxLength={20000}
          required
          rows={5}
          disabled={loading || checkingAnswer || isEvaluated}
          placeholder="Explain your approach and write your answer here..."
          className="w-full rounded-xl border border-slate-200 px-4 py-3 leading-6 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50"
        />

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-400">
            {answerText.length}/20000 characters
          </p>

          <button
            type="submit"
            disabled={
              loading ||
              checkingAnswer ||
              isEvaluated ||
              !answerText.trim()
            }
            className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {checkingAnswer
              ? 'Loading saved answer...'
              : loading
                ? 'Evaluating your answer...'
                : savedAnswer
                  ? 'Evaluate saved answer'
                  : 'Submit & evaluate answer'}
          </button>
        </div>
      </form>

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {isEvaluated && (
        <section className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-5">
          <h4 className="font-bold text-green-900">
            AI evaluation complete
          </h4>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              {
                label: 'Technical score',
                value: evaluation.technical_score,
              },
              {
                label: 'Communication score',
                value: evaluation.communication_score,
              },
              {
                label: 'Correctness score',
                value: evaluation.correctness_score,
              },
            ].map((score) => (
              <div
                key={score.label}
                className="rounded-xl border border-green-100 bg-white p-4"
              >
                <p className="text-xs text-slate-500">
                  {score.label}
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {score.value ?? '—'}
                  {score.value != null ? '/10' : ''}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-5">
            <h5 className="font-semibold text-slate-900">Feedback</h5>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">
              {evaluation.feedback || 'No feedback was returned.'}
            </p>
          </div>
        </section>
      )}
    </div>
  )
}