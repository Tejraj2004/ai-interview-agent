
import { useEffect, useState } from 'react'
import { apiRequest } from '../services/api'
import JobDescription from './JobDescription'
import InterviewSession from './InterviewSession'

function Dashboard() {
  const [activePage, setActivePage] = useState('Dashboard')
  const [interviews, setInterviews] = useState([])
  const [jobs, setJobs] = useState([])
  const [reports, setReports] = useState([])
  const [reportsLoading, setReportsLoading] = useState(false)
  const [reportsError, setReportsError] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [selectedInterview, setSelectedInterview] = useState(null)
  const [sessionQuestions, setSessionQuestions] = useState([])
  const [openingInterviewId, setOpeningInterviewId] = useState(null)
  const [sessionError, setSessionError] = useState('')

  const [profileOpen, setProfileOpen] = useState(false)
  const [userProfile, setUserProfile] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function fetchDashboard() {
      try {
        setError('')

        const [interviewData, jobData, profileData] =
          await Promise.all([
            apiRequest('/interviews'),
            apiRequest('/jobs'),
            apiRequest('/auth/me'),
          ])

        if (!cancelled) {
          setInterviews(
            Array.isArray(interviewData) ? interviewData : []
          )
          setJobs(Array.isArray(jobData) ? jobData : [])
          setUserProfile(profileData)
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message || 'Could not load dashboard data.'
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchDashboard()

    return () => {
      cancelled = true
    }
  }, [])

    useEffect(() => {
    if (
  activePage !== 'Reports' &&
  activePage !== 'Dashboard' &&
  activePage !== 'Analytics'
) {
  return
}

    let cancelled = false

    async function fetchReports() {
      setReportsLoading(true)
      setReportsError('')

      try {
        const results = await Promise.all(
          interviews.map(async (interview) => {
            try {
              return await apiRequest(
                `/reports/interviews/${interview.id}`
              )
            } catch (err) {
              if (
                err.message?.toLowerCase().includes('report not found')
              ) {
                return null
              }

              throw err
            }
          })
        )

        if (!cancelled) {
          setReports(results.filter(Boolean))
        }
      } catch (err) {
        if (!cancelled) {
          setReportsError(
            err.message || 'Could not load interview reports.'
          )
        }
      } finally {
        if (!cancelled) {
          setReportsLoading(false)
        }
      }
    }

    fetchReports()

    return () => {
      cancelled = true
    }
  }, [activePage, interviews])

  async function handleOpenInterview(interview) {
    setOpeningInterviewId(interview.id)
    setSessionError('')

    try {
      const result = await apiRequest(
        `/interviews/${interview.id}/generate-questions`,
        { method: 'POST' }
      )

      if (!Array.isArray(result) || result.length === 0) {
        throw new Error(
          'No questions are available for this interview.'
        )
      }

      setSelectedInterview(interview)
      setSessionQuestions(result)
      setActivePage('Interview Session')
      setProfileOpen(false)
    } catch (err) {
      setSessionError(
        err.message || 'Could not open this interview.'
      )
    } finally {
      setOpeningInterviewId(null)
    }
  }

  function handleLogout() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    window.location.href = '/login'
  }

  
  const analyticsReports = [...reports].sort(
  (a, b) =>
    new Date(a.created_at).getTime() -
    new Date(b.created_at).getTime()
)

const averageOf = (key) => {
  const values = analyticsReports
    .map((report) => Number(report[key]))
    .filter(Number.isFinite)

  if (values.length === 0) return null

  return values.reduce((sum, value) => sum + value, 0) / values.length
}

const averageOverall = averageOf('overall_score')
const averageTechnical = averageOf('technical_score')
const averageCommunication = averageOf('communication_score')

const latestReport = analyticsReports.at(-1) || null
const previousReport =
  analyticsReports.length > 1
    ? analyticsReports[analyticsReports.length - 2]
    : null

const scoreChange =
  latestReport && previousReport
    ? Number(latestReport.overall_score) -
      Number(previousReport.overall_score)
    : null

const strongestSkill =
  averageTechnical == null && averageCommunication == null
    ? 'Not enough data'
    : averageTechnical == null
      ? 'Communication'
      : averageCommunication == null
        ? 'Technical'
        : averageTechnical >= averageCommunication
          ? 'Technical'
          : 'Communication'

const formatScore = (score) =>
  score == null ? '—' : Number(score).toFixed(2)

const getScoreWidth = (score) =>
  Math.max(0, Math.min(100, (Number(score) || 0) * 10))


  const navigation = [
    { name: 'Dashboard', icon: '⌂' },
    { name: 'My Interviews', icon: '▤' },
    { name: 'Job Descriptions', icon: '▧' },
    { name: 'Reports', icon: '▥' },
    { name: 'Analytics', icon: '↗' },
  ]

  if (activePage === 'Interview Session' && selectedInterview) {
    return (
      <InterviewSession
        interview={selectedInterview}
        questions={sessionQuestions}
        onBack={() => {
          setActivePage('My Interviews')
          setSessionError('')
        }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 md:flex">
      {/* Sidebar */}
      <aside className="flex w-full flex-col border-r border-slate-200 bg-white md:fixed md:inset-y-0 md:w-64">
        <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-600 font-bold text-white">
            AI
          </div>

          <div>
            <h1 className="font-bold tracking-tight">
              InterviewAI
            </h1>
            <p className="text-xs text-slate-500">
              Your career copilot
            </p>
          </div>
        </div>

        <div className="px-4 py-6">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
            Workspace
          </p>

          <nav className="space-y-1">
            {navigation.map((item) => (
              <button
                key={item.name}
                type="button"
                onClick={() => {
                  setActivePage(item.name)
                  setProfileOpen(false)
                  setSessionError('')
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${
                  activePage === item.name
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto hidden p-4 md:block">
          <div className="rounded-2xl bg-slate-900 p-4 text-white">
            <p className="font-semibold">
              Practice makes progress
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Prepare for your next technical interview, one
              question at a time.
            </p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="min-w-0 flex-1 p-5 md:ml-64 md:p-9 lg:p-10">
        <header className="relative z-40 mb-9 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">
              Workspace / {activePage}
            </p>

            <h2 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
              {activePage === 'Dashboard'
                ? 'Your interview workspace'
                : activePage}
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Build confidence. Practice smarter. Get interview-ready.
            </p>
          </div>

          {/* Profile button and dropdown */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setProfileOpen((open) => !open)}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-indigo-100 bg-indigo-50 font-bold text-indigo-700 transition hover:bg-indigo-100"
              aria-label="Open profile menu"
              aria-expanded={profileOpen}
            >
              {userProfile?.name
                ? userProfile.name.charAt(0).toUpperCase()
                : 'AI'}
            </button>

            {profileOpen && (
              <>
                {/* Click outside to close */}
                <button
                  type="button"
                  aria-label="Close profile menu"
                  className="fixed inset-0 z-[90] cursor-default"
                  onClick={() => setProfileOpen(false)}
                />

                {/* Fixed dropdown stays above the hero and other content */}
                <div className="fixed right-4 top-20 z-[100] w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-2xl sm:right-8">
                  <p className="break-words font-semibold">
                    {userProfile?.name || 'InterviewAI User'}
                  </p>

                  <p className="mt-1 break-all text-sm text-slate-500">
                    {userProfile?.email || 'Account details unavailable'}
                  </p>

                  <div className="my-4 border-t border-slate-200" />

                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false)
                      handleLogout()
                    }}
                    className="w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50"
                  >
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Loading */}
        {loading && (
          <p className="mb-6 text-sm text-slate-500">
            Loading your dashboard...
          </p>
        )}

        {/* API error */}
        {error && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <p>{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-2 font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Interview session errors */}
        {sessionError && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {sessionError}
          </div>
        )}

        {/* Dashboard */}
        {activePage === 'Dashboard' && (
          <>
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 p-6 text-white shadow-lg shadow-indigo-100 md:p-9">
              <div className="relative z-10 max-w-2xl">
                <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium">
                  AI-powered interview preparation
                </span>

                <h3 className="mt-5 text-3xl font-bold leading-tight md:text-4xl">
                  Your next opportunity starts with practice.
                </h3>

                <p className="mt-4 max-w-xl text-sm leading-7 text-indigo-100 md:text-base">
                  Add a job description and let your AI interview
                  agent prepare role-specific questions and evaluate
                  your answers.
                </p>

                <button
                  type="button"
                  onClick={() => setActivePage('Job Descriptions')}
                  className="mt-6 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-50"
                >
                  Start a new interview →
                </button>
              </div>

              <div className="pointer-events-none absolute -right-10 -top-16 h-64 w-64 rounded-full border-[35px] border-white/10" />
              <div className="pointer-events-none absolute -bottom-28 right-32 h-64 w-64 rounded-full border-[35px] border-white/10" />
            </section>

            <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  label: 'Total interviews',
                  value: interviews.length,
                  note: 'Your saved interviews',
                },
                {
                  label: 'Average score',
                  value: reports.length
                    ? (
                        reports.reduce(
                          (sum, report) => sum + Number(report.overall_score || 0),
                          0
                        ) / reports.length
                      ).toFixed(2)
                    : '—',
                  note: 'Based on completed reports',
                },
                {
                  label: 'Jobs analyzed',
                  value: jobs.length,
                  note: 'Saved job descriptions',
                },
                {
                  label: 'Reports ready',
                  value: reports.length,
                  note: 'Saved interview reports',
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"
                >
                  <p className="text-sm text-slate-500">
                    {stat.label}
                  </p>
                  <p className="mt-3 text-3xl font-bold">
                    {stat.value}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    {stat.note}
                  </p>
                </div>
              ))}
            </section>

            <section className="mt-9">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold">
                    Your interviews
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Interviews saved to your account
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setActivePage('My Interviews')}
                  className="text-sm font-semibold text-indigo-700 hover:text-indigo-900"
                >
                  View interviews →
                </button>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                {!loading && interviews.length === 0 ? (
                  <div className="p-6">
                    <p className="font-medium">No interviews yet</p>
                    <p className="mt-2 text-sm text-slate-500">
                      Add a job description to begin your first
                      practice interview.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActivePage('Job Descriptions')}
                      className="mt-4 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                    >
                      Add job description
                    </button>
                  </div>
                ) : (
                  interviews.map((interview, index) => (
                    <div
                      key={interview.id}
                      className={`flex flex-wrap items-center justify-between gap-4 p-5 ${
                        index !== 0 ? 'border-t border-slate-100' : ''
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-lg font-bold text-indigo-700">
                          {interview.id}
                        </div>
                        <div>
                          <p className="font-semibold">
                            Interview #{interview.id}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            Job #{interview.job_description_id} ·{' '}
                            {interview.difficulty}
                          </p>
                        </div>
                      </div>

                      <span className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-medium capitalize text-indigo-700">
                        {interview.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>
          </>
        )}

        {/* My Interviews */}
        {activePage === 'My Interviews' && (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold">My Interviews</h3>
                <p className="mt-1 text-sm text-slate-500">
                  View and continue your saved interview sessions.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActivePage('Job Descriptions')}
                className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                + New interview
              </button>
            </div>

            {loading ? (
              <p className="mt-5 text-sm text-slate-500">
                Loading your interviews...
              </p>
            ) : interviews.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-slate-300 p-8 text-center">
                <h4 className="font-semibold">No interviews yet</h4>
                <p className="mt-2 text-sm text-slate-500">
                  Analyze a job description and generate your first interview.
                </p>
                <button
                  type="button"
                  onClick={() => setActivePage('Job Descriptions')}
                  className="mt-4 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  Analyze a job description
                </button>
              </div>
            ) : (
              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                {interviews.map((interview) => (
                  <article
                    key={interview.id}
                    className="rounded-2xl border border-slate-200 p-5 transition hover:border-indigo-200 hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-slate-900">
                          Interview #{interview.id}
                        </h4>
                        <p className="mt-1 text-sm text-slate-500">
                          Job #{interview.job_description_id}
                        </p>
                      </div>

                      <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold capitalize text-indigo-700">
                        {interview.status || 'created'}
                      </span>
                    </div>

                    <div className="mt-4">
                      <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs capitalize text-slate-600">
                        Difficulty: {interview.difficulty || 'Not specified'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenInterview(interview)}
                      disabled={openingInterviewId !== null}
                      className="mt-5 w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {openingInterviewId === interview.id
                        ? 'Opening interview...'
                        : 'Continue Interview →'}
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Job Descriptions */}
        {activePage === 'Job Descriptions' && <JobDescription />}

        
        {/* Analytics */}
        {activePage === 'Analytics' && (
          <section className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                Interview Performance
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Track your progress and discover what to improve
                across your completed interviews.
              </p>
            </div>

            {reportsLoading ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
                Loading your performance data...
              </div>
            ) : reportsError ? (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
              >
                {reportsError}
              </div>
            ) : reports.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
                <h4 className="text-lg font-bold text-slate-900">
                  Your analytics will appear here
                </h4>
                <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
                  Complete an interview and generate its report to
                  start tracking your scores and practice priorities.
                </p>
                <button
                  type="button"
                  onClick={() => setActivePage('My Interviews')}
                  className="mt-5 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  View interviews
                </button>
              </div>
            ) : (
              <>
                {/* Summary cards */}
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    {
                      label: 'Average overall score',
                      value:
                        averageOverall == null
                          ? '—'
                          : `${formatScore(averageOverall)}/10`,
                      note: `Across ${reports.length} saved report${reports.length === 1 ? '' : 's'}`,
                    },
                    {
                      label: 'Average technical',
                      value:
                        averageTechnical == null
                          ? '—'
                          : `${formatScore(averageTechnical)}/10`,
                      note: 'Technical performance',
                    },
                    {
                      label: 'Average communication',
                      value:
                        averageCommunication == null
                          ? '—'
                          : `${formatScore(averageCommunication)}/10`,
                      note: 'Communication performance',
                    },
                    {
                      label: 'Strongest skill',
                      value: strongestSkill,
                      note: 'Based on available skill averages',
                    },
                  ].map((item) => (
                    <article
                      key={item.label}
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                    >
                      <p className="text-sm text-slate-500">
                        {item.label}
                      </p>
                      <p className="mt-3 break-words text-2xl font-bold text-indigo-700">
                        {item.value}
                      </p>
                      <p className="mt-2 text-xs text-slate-400">
                        {item.note}
                      </p>
                    </article>
                  ))}
                </div>

                {/* Score comparison chart */}
                <section className="rounded-2xl border border-slate-200 bg-white p-6">
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-slate-900">
                      Score comparison
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Compare overall, technical, and communication
                      scores for each saved report.
                    </p>
                  </div>

                  <div className="mb-5 flex flex-wrap gap-4 text-xs font-medium text-slate-600">
                    {[
                      { label: 'Overall', color: 'bg-indigo-600' },
                      { label: 'Technical', color: 'bg-violet-500' },
                      { label: 'Communication', color: 'bg-sky-500' },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-2">
                        <span className={`h-3 w-3 rounded-sm ${item.color}`} />
                        {item.label}
                      </div>
                    ))}
                  </div>

                  <div className="space-y-7">
                    {analyticsReports.map((report, index) => (
                      <div key={report.id}>
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-800">
                            Interview #{report.interview_id}
                          </p>
                          <p className="text-xs text-slate-400">
                            {report.created_at
                              ? new Date(report.created_at).toLocaleDateString()
                              : `Report ${index + 1}`}
                          </p>
                        </div>

                        <div className="space-y-3">
                          {[
                            {
                              label: 'Overall',
                              score: report.overall_score,
                              color: 'bg-indigo-600',
                            },
                            {
                              label: 'Technical',
                              score: report.technical_score,
                              color: 'bg-violet-500',
                            },
                            {
                              label: 'Communication',
                              score: report.communication_score,
                              color: 'bg-sky-500',
                            },
                          ].map((item) => (
                            <div
                              key={item.label}
                              className="grid grid-cols-[100px_minmax(0,1fr)_55px] items-center gap-3"
                            >
                              <span className="text-xs text-slate-500">
                                {item.label}
                              </span>
                              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                                {item.score != null && (
                                  <div
                                    className={`h-full rounded-full ${item.color} transition-all`}
                                    style={{
                                      width: `${getScoreWidth(item.score)}%`,
                                    }}
                                  />
                                )}
                              </div>
                              <span className="text-right text-xs font-semibold text-slate-700">
                                {item.score == null
                                  ? '—'
                                  : `${formatScore(item.score)}`}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="mt-6 border-t border-slate-100 pt-4 text-xs text-slate-400">
                    Scores are out of 10. Reports are ordered from oldest
                    to newest by creation date.
                  </p>
                </section>

                {/* Latest interview comparison */}
                <section className="rounded-2xl border border-slate-200 bg-white p-6">
                  <h3 className="text-lg font-bold text-slate-900">
                    Recent progress
                  </h3>

                  {!previousReport ? (
                    <p className="mt-3 text-sm leading-6 text-slate-500">
                      Complete another interview and generate its report
                      to compare your latest performance with a previous one.
                    </p>
                  ) : (
                    <div className="mt-5 grid gap-4 sm:grid-cols-3">
                      <div className="rounded-xl bg-slate-50 p-4">
                        <p className="text-sm text-slate-500">
                          Previous overall
                        </p>
                        <p className="mt-2 text-2xl font-bold text-slate-900">
                          {formatScore(previousReport.overall_score)}/10
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          Interview #{previousReport.interview_id}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-4">
                        <p className="text-sm text-slate-500">
                          Latest overall
                        </p>
                        <p className="mt-2 text-2xl font-bold text-indigo-700">
                          {formatScore(latestReport.overall_score)}/10
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          Interview #{latestReport.interview_id}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-4">
                        <p className="text-sm text-slate-500">
                          Score difference
                        </p>
                        <p
                          className={`mt-2 text-2xl font-bold ${
                            scoreChange > 0
                              ? 'text-green-700'
                              : scoreChange < 0
                                ? 'text-red-600'
                                : 'text-slate-900'
                          }`}
                        >
                          {scoreChange > 0 ? '+' : ''}
                          {scoreChange == null
                            ? '—'
                            : scoreChange.toFixed(2)}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {scoreChange > 0
                            ? 'Improvement'
                            : scoreChange < 0
                              ? 'Decrease'
                              : 'No score change'}
                        </p>
                      </div>
                    </div>
                  )}
                </section>

                {/* Practice priorities */}
                <section className="rounded-2xl border border-slate-200 bg-white p-6">
                  <h3 className="text-lg font-bold text-slate-900">
                    Practice priorities
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Review the feedback from your most recent interview.
                  </p>

                  <div className="mt-5 grid gap-4 lg:grid-cols-3">
                    {[
                      {
                        title: 'Strengths',
                        content: latestReport.strengths,
                        icon: '✓',
                      },
                      {
                        title: 'Areas to improve',
                        content: latestReport.weaknesses,
                        icon: '↗',
                      },
                      {
                        title: 'Recommended practice',
                        content: latestReport.recommendations,
                        icon: '◎',
                      },
                    ].map((item) => (
                      <article
                        key={item.title}
                        className="rounded-xl border border-slate-200 p-4"
                      >
                        <div className="flex items-center gap-2">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 font-bold text-indigo-700">
                            {item.icon}
                          </span>
                          <h4 className="font-semibold text-slate-900">
                            {item.title}
                          </h4>
                        </div>
                        <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">
                          {item.content || 'No feedback available yet.'}
                        </p>
                      </article>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setActivePage('Reports')}
                    className="mt-5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    View full reports
                  </button>
                </section>
              </>
            )}
          </section>
        )}

        {/* Reports */}
        {activePage === 'Reports' && (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold">Interview Reports</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Review your AI-generated interview scores and feedback.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActivePage('My Interviews')}
                className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                My Interviews
              </button>
            </div>

            {reportsLoading ? (
              <p className="mt-6 text-sm text-slate-500">
                Loading your reports...
              </p>
            ) : reportsError ? (
              <div
                role="alert"
                className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
              >
                {reportsError}
                <button
                  type="button"
                  onClick={() => setActivePage('Dashboard')}
                  className="ml-2 font-semibold underline"
                >
                  Return to dashboard
                </button>
              </div>
            ) : reports.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-8 text-center">
                <h4 className="font-semibold text-slate-900">
                  No reports yet
                </h4>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Complete and evaluate interview answers, then generate
                  an AI report to see your scores and recommendations here.
                </p>
                <button
                  type="button"
                  onClick={() => setActivePage('My Interviews')}
                  className="mt-4 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  View my interviews
                </button>
              </div>
            ) : (
              <div className="mt-6 grid gap-5 lg:grid-cols-2">
                {reports.map((report) => (
                  <article
                    key={report.id}
                    className="rounded-2xl border border-slate-200 p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-slate-900">
                          Interview #{report.interview_id}
                        </h4>
                        <p className="mt-1 text-xs text-slate-500">
                          {report.created_at
                            ? new Date(report.created_at).toLocaleString()
                            : 'Date unavailable'}
                        </p>
                      </div>
                      <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                        Report ready
                      </span>
                    </div>

                    <div className="mt-5 grid grid-cols-3 gap-3">
                      {[
                        {
                          label: 'Overall',
                          score: report.overall_score,
                        },
                        {
                          label: 'Technical',
                          score: report.technical_score,
                        },
                        {
                          label: 'Communication',
                          score: report.communication_score,
                        },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="rounded-xl bg-slate-50 p-3"
                        >
                          <p className="text-xs text-slate-500">
                            {item.label}
                          </p>
                          <p className="mt-2 text-lg font-bold text-indigo-700">
                            {item.score == null
                              ? '—'
                              : `${Number(item.score).toFixed(2)}/10`}
                          </p>
                        </div>
                      ))}
                    </div>

                    {[
                      {
                        title: 'Strengths',
                        content: report.strengths,
                      },
                      {
                        title: 'Areas to improve',
                        content: report.weaknesses,
                      },
                      {
                        title: 'Recommendations',
                        content: report.recommendations,
                      },
                    ].map((item) => (
                      <details key={item.title} className="mt-4">
                        <summary className="cursor-pointer text-sm font-semibold text-slate-800">
                          {item.title}
                        </summary>
                        <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">
                          {item.content || 'No information available.'}
                        </p>
                      </details>
                    ))}
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        <footer className="mt-10 border-t border-slate-200 pt-5 text-xs text-slate-400">
          InterviewAI · AI-assisted practice for your next opportunity
        </footer>
      </main>
    </div>
  )
}

export default Dashboard
