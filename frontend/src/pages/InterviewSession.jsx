import { useCallback, useEffect, useState } from 'react'
import QuestionAnswer from '../components/QuestionAnswer'
import { apiRequest } from '../services/api'

export default function InterviewSession({
  interview,
  questions = [],
  onBack,
}) {
  const [currentIndex, setCurrentIndex] = useState(0)
const [evaluatedQuestions, setEvaluatedQuestions] = useState([])
const [checkingProgress, setCheckingProgress] = useState(true)

useEffect(() => {
  let cancelled = false

  async function loadEvaluatedQuestions() {
    setCheckingProgress(true)

    try {
      const results = await Promise.all(
        questions.map(async (question) => {
          try {
            const answer = await apiRequest(
              `/answers/questions/${question.id}`
            )

            if (
              answer &&
              answer.technical_score != null &&
              answer.communication_score != null &&
              answer.correctness_score != null &&
              answer.feedback != null
            ) {
              return question.id
            }

            return null
          } catch {
            return null
          }
        })
      )

      if (!cancelled) {
        setEvaluatedQuestions(results.filter((id) => id !== null))
      }
    } finally {
      if (!cancelled) {
        setCheckingProgress(false)
      }
    }
  }

  loadEvaluatedQuestions()

  return () => {
    cancelled = true
  }
}, [questions])
  const [generatingReport, setGeneratingReport] = useState(false)
  const [report, setReport] = useState(null)
  const [reportError, setReportError] = useState('')

  const totalQuestions = questions.length
  const currentQuestion = questions[currentIndex]
  const progress =
    totalQuestions > 0
      ? ((currentIndex + 1) / totalQuestions) * 100
      : 0

  const handleEvaluationComplete = useCallback((questionId) => {
  setEvaluatedQuestions((previous) =>
    previous.includes(questionId)
      ? previous
      : [...previous, questionId]
  )
}, [])

  async function handleGenerateReport() {
    setGeneratingReport(true)
    setReportError('')
    setReport(null)

    try {
      const result = await apiRequest(
        `/reports/interviews/${interview.id}`,
        { method: 'POST' }
      )
      setReport(result)
    } catch (error) {
      setReportError(
        error.message || 'Could not generate the interview report.'
      )
    } finally {
      setGeneratingReport(false)
    }
  }

  if (totalQuestions === 0) {
    return (
      <main className="mx-auto max-w-4xl p-6 md:p-10">
        <button
          type="button"
          onClick={onBack}
          className="mb-6 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
        >
          ← Back
        </button>

        <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <h1 className="text-xl font-bold text-slate-900">
            No interview questions available
          </h1>
          <p className="mt-3 text-sm text-slate-500">
            Generate questions for this interview before starting.
          </p>
        </section>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-5xl p-5 md:p-10">
      <button
        type="button"
        onClick={onBack}
        className="mb-6 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
      >
        ← Back to workspace
      </button>

      <header className="mb-8">
        <p className="text-sm font-medium text-indigo-600">
          InterviewAI / Interview session
        </p>

        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Technical interview
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Interview #{interview?.id ?? '—'}
              {' · '}
              Difficulty: {interview?.difficulty ?? 'Not specified'}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-xs text-slate-500">Evaluated</p>
            <p className="mt-1 text-xl font-bold text-slate-900">
              {checkingProgress
  ? '...'
  : `${evaluatedQuestions.length}/${totalQuestions}`}
            </p>
          </div>
        </div>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-indigo-600">
            Question {currentIndex + 1} of {totalQuestions}
          </p>

          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium capitalize text-slate-600">
            {currentQuestion.question_type || 'General'}
          </span>
        </div>

        <div
          className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100"
          role="progressbar"
          aria-label="Interview progress"
          aria-valuemin={0}
          aria-valuemax={totalQuestions}
          aria-valuenow={currentIndex + 1}
        >
          <div
            className="h-full rounded-full bg-indigo-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <h2 className="mt-8 text-xl font-semibold leading-8 text-slate-900 md:text-2xl">
          {currentQuestion.question_text}
        </h2>

        <p className="mt-3 text-sm capitalize text-slate-500">
          Difficulty: {currentQuestion.difficulty || 'Not specified'}
        </p>

        <QuestionAnswer
          key={currentQuestion.id}
          question={currentQuestion}
          onEvaluationComplete={() =>
            handleEvaluationComplete(currentQuestion.id)
          }
        />

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-6">
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((index) => index - 1)}
            className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← Previous
          </button>

          <p className="text-xs text-slate-500">
            {evaluatedQuestions.length} of {totalQuestions} evaluated
          </p>

          <button
            type="button"
            disabled={currentIndex === totalQuestions - 1}
            onClick={() => setCurrentIndex((index) => index + 1)}
            className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next question →
          </button>
        </div>
      </section>

      {currentIndex === totalQuestions - 1 &&
        evaluatedQuestions.length === totalQuestions && (
          <section className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-6">
            <h2 className="font-bold text-green-900">
              All questions evaluated!
            </h2>
            <p className="mt-2 text-sm text-green-800">
              You have submitted and evaluated every question in this session.
            </p>

            <button
              type="button"
              onClick={handleGenerateReport}
              disabled={generatingReport}
              className="mt-5 rounded-xl bg-green-700 px-5 py-3 text-sm font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {generatingReport
                ? 'Generating report...'
                : 'Generate AI Interview Report'}
            </button>
          </section>
        )}

      {reportError && (
        <section
          role="alert"
          className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <p className="font-semibold">Report generation failed</p>
          <p className="mt-1">{reportError}</p>
        </section>
      )}

      {report && (
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-green-700">
                Report generated successfully
              </p>
              <h2 className="mt-1 text-2xl font-bold text-slate-900">
                Your Interview Report
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Interview #{report.interview_id}
              </p>
            </div>
            <button
              type="button"
              onClick={onBack}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Back to dashboard
            </button>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              {
                label: 'Overall score',
                value: report.overall_score,
              },
              {
                label: 'Technical score',
                value: report.technical_score,
              },
              {
                label: 'Communication score',
                value: report.communication_score,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl bg-slate-50 p-5"
              >
                <p className="text-sm text-slate-500">{item.label}</p>
                <p className="mt-2 text-3xl font-bold text-indigo-700">
                  {item.value == null
                    ? '—'
                    : `${Number(item.value).toFixed(2)}/10`}
                </p>
              </div>
            ))}
          </div>

          {[
            { title: 'Strengths', content: report.strengths },
            { title: 'Areas to improve', content: report.weaknesses },
            {
              title: 'Recommendations',
              content: report.recommendations,
            },
          ].map((item) => (
            <div key={item.title} className="mt-6">
              <h3 className="text-lg font-semibold text-slate-900">
                {item.title}
              </h3>
              <div className="mt-2 whitespace-pre-line rounded-xl border border-slate-200 p-4 text-sm leading-7 text-slate-700">
                {item.content || 'No information available.'}
              </div>
            </div>
          ))}

          <p className="mt-6 text-xs text-slate-400">
            Report saved on{' '}
            {report.created_at
              ? new Date(report.created_at).toLocaleString()
              : '—'}
          </p>
        </section>
      )}
    </main>
  )
}
