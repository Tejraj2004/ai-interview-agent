
import { useState } from 'react'
import { apiRequest } from '../services/api'
import QuestionAnswer from '../components/QuestionAnswer'
import InterviewSession from './InterviewSession'
export default function JobDescription() {
  const [title, setTitle] = useState('')
  const [company, setCompany] = useState('')
  const [description, setDescription] = useState('')
  const [sessionStarted, setSessionStarted] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  const [savedJob, setSavedJob] = useState(null)

  const [difficulty, setDifficulty] = useState('medium')
  const [interview, setInterview] = useState(null)
  const [questions, setQuestions] = useState([])

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [creatingInterview, setCreatingInterview] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()

    setError('')
    setAnalysis(null)
    setSavedJob(null)
    setInterview(null)
    setQuestions([])
    setLoading(true)

    try {
      const result = await apiRequest('/jobs', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          company: company.trim() || null,
          description: description.trim(),
        }),
      })

      if (result.id == null) {
        throw new Error(
          'The job was analyzed, but the saved job ID was not returned.'
        )
      }

      setSavedJob(result)
      setAnalysis(result.ai_analysis)
    } catch (err) {
      setError(err.message || 'Could not analyze the job description.')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateInterview() {
    if (!savedJob?.id) {
      setError('Please analyze and save a job description first.')
      return
    }

    setError('')
    setCreatingInterview(true)
    setInterview(null)
    setQuestions([])

    try {
      // Step 1: Create an interview for the saved job.
      const interviewResult = await apiRequest('/interviews', {
        method: 'POST',
        body: JSON.stringify({
          job_description_id: savedJob.id,
          difficulty,
        }),
      })

      setInterview(interviewResult)

      // Step 2: Generate and save questions for that interview.
      const questionResult = await apiRequest(
        `/interviews/${interviewResult.id}/generate-questions`,
        {
          method: 'POST',
        }
      )

      setQuestions(
        Array.isArray(questionResult) ? questionResult : []
      )
    } catch (err) {
      setError(
        err.message ||
          'Could not create the interview or generate questions.'
      )
    } finally {
      setCreatingInterview(false)
    }
  }
if (sessionStarted && interview) {
  return (
    <InterviewSession
      interview={interview}
      questions={questions}
      onBack={() => setSessionStarted(false)}
    />
  )
}
  return (
    <div className="min-h-screen bg-slate-50 p-5 md:p-10">
      <div className="mx-auto max-w-4xl">
        <p className="text-sm font-medium text-indigo-700">
          InterviewAI / Job preparation
        </p>

        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
          Analyze a job description
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
          Analyze a job description, create a personalized interview,
          and generate AI-powered questions.
        </p>

        {/* Job description form */}
        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"
        >
          <div>
            <label
              htmlFor="title"
              className="mb-2 block text-sm font-semibold"
            >
              Job title
            </label>

            <input
              id="title"
              required
              minLength={2}
              maxLength={150}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Software Engineer"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            />
          </div>

          <div>
            <label
              htmlFor="company"
              className="mb-2 block text-sm font-semibold"
            >
              Company{' '}
              <span className="font-normal text-slate-400">
                (optional)
              </span>
            </label>

            <input
              id="company"
              maxLength={150}
              value={company}
              onChange={(event) => setCompany(event.target.value)}
              placeholder="e.g. NVIDIA"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="mb-2 block text-sm font-semibold"
            >
              Full job description
            </label>

            <textarea
              id="description"
              required
              minLength={20}
              rows={9}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Paste the responsibilities, required skills, qualifications, and experience here..."
              className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 leading-6 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            />

            <p className="mt-2 text-xs text-slate-400">
              Include at least 20 characters.
            </p>
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || creatingInterview}
            className="w-full rounded-xl bg-indigo-600 px-5 py-3.5 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {loading
              ? 'Analyzing with AI...'
              : 'Analyze job description →'}
          </button>
        </form>

        {/* AI analysis */}
        {analysis && (
          <section className="mt-8 rounded-3xl border border-indigo-100 bg-white p-6 shadow-sm md:p-8">
            <p className="text-sm font-semibold text-indigo-700">
              AI analysis complete
            </p>

            <h2 className="mt-2 text-2xl font-bold text-slate-900">
              {analysis.job_role || title}
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Seniority: {analysis.seniority_level || 'Not specified'}
              {' · '}
              Difficulty: {analysis.difficulty_level || 'Not specified'}
            </p>

            <div className="mt-7">
              <h3 className="font-semibold">Required skills</h3>

              <div className="mt-3 flex flex-wrap gap-2">
                {(analysis.required_skills || []).map((skill, index) => (
                  <span
                    key={`${skill}-${index}`}
                    className="rounded-full bg-indigo-50 px-3 py-1.5 text-sm text-indigo-700"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-7">
              <h3 className="font-semibold">
                Important interview topics
              </h3>

              <ul className="mt-3 list-inside list-disc space-y-2 text-sm leading-6 text-slate-600">
                {(analysis.important_topics || []).map((topic, index) => (
                  <li key={`${topic}-${index}`}>{topic}</li>
                ))}
              </ul>
            </div>

            <div className="mt-7">
              <h3 className="font-semibold">Interview focus</h3>

              <ul className="mt-3 list-inside list-disc space-y-2 text-sm leading-6 text-slate-600">
                {(analysis.interview_focus || []).map((focus, index) => (
                  <li key={`${focus}-${index}`}>{focus}</li>
                ))}
              </ul>
            </div>

            {/* Create interview */}
            <div className="mt-8 border-t border-slate-100 pt-6">
              <h3 className="text-lg font-bold">
                Ready to start your interview?
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Your saved job analysis will be used to generate
                personalized interview questions.
              </p>

              <div className="mt-5">
                <label
                  htmlFor="difficulty"
                  className="mb-2 block text-sm font-semibold"
                >
                  Interview difficulty
                </label>

                <select
                  id="difficulty"
                  value={difficulty}
                  onChange={(event) => setDifficulty(event.target.value)}
                  disabled={creatingInterview}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 sm:max-w-xs"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleCreateInterview}
                disabled={creatingInterview || !savedJob?.id}
                className="mt-5 w-full rounded-xl bg-violet-600 px-5 py-3.5 font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {creatingInterview
                  ? 'Creating interview and generating questions...'
                  : 'Create interview & generate questions →'}
              </button>

              <p className="mt-3 text-xs text-slate-400">
                Saved job ID: {savedJob?.id ?? 'Not available'}
              </p>
            </div>
          </section>
        )}

        {/* Generated questions */}
        {interview && (
          <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <p className="text-sm font-semibold text-green-700">
              Interview created
            </p>

            <h2 className="mt-2 text-2xl font-bold text-slate-900">
              Interview #{interview.id}
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Difficulty: {interview.difficulty}
              {' · '}
              Status: {interview.status}
            </p>

            <div className="mt-7">
              <h3 className="text-lg font-bold">
                Generated interview questions
              </h3>
              <button
  type="button"
  onClick={() => setSessionStarted(true)}
  disabled={questions.length === 0}
  className="mt-5 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
>
  Start Interview →
</button>

              {questions.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">
                  The interview was created, but no questions were returned.
                  Check the error message or backend logs.
                </p>
              ) : (
                <div className="mt-5 space-y-4">
                  {questions.map((question, index) => (
                    <article
  key={question.id ?? index}
  className="rounded-2xl border border-slate-200 p-5"
>
  <div className="flex flex-wrap items-center justify-between gap-2">
    <p className="font-semibold text-slate-900">
      Question {question.order_number ?? index + 1}
    </p>

    <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
      {question.difficulty || difficulty}
    </span>
  </div>

  <p className="mt-3 leading-7 text-slate-700">
    {question.question_text}
  </p>

  {question.question_type && (
    <p className="mt-3 text-xs text-slate-400">
      Type: {question.question_type}
    </p>
  )}

  <QuestionAnswer question={question} />
</article>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
