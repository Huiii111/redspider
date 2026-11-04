import { NO_RUN } from '../api.js'

const RESULTS_LINK = { href: '#/', label: 'See all results' }
const TRY_IT_LINK = { href: '#/try', label: 'Try the scanners yourself' }

const FAILURE_HELP = {
  UNREACHABLE: {
    title: "We can't connect right now",
    message:
      "Nothing you did caused this. Check your internet connection, then try again. If it still doesn't load, ask the person running this site to check that it's on.",
  },
  INTERNAL: {
    title: 'Something went wrong on our side',
    message: "Nothing you did caused this. Try again. If it keeps happening, ask the person running this site.",
  },
  CASE_NOT_FOUND: {
    title: "We can't find this hidden problem",
    message: 'This link may be out of date. Every hidden problem we tested is listed in the results.',
    link: RESULTS_LINK,
  },
  [NO_RUN]: {
    title: "The scanners haven't been tested yet",
    message: "There's nothing to show here until the first test has run. You can still run the scanners yourself.",
    link: TRY_IT_LINK,
  },
  BUSY: {
    title: 'Another scan is still running',
    message: 'Wait a few seconds, then press the button again.',
  },
  INPUT_TOO_LARGE: {
    title: "That's too much code for one scan",
    message: "Remove the parts you aren't testing, then try again.",
  },
  INVALID_INPUT: {
    title: "The scanners couldn't read that",
    message: 'Put code in both boxes, then try again.',
  },
}

export function explainFailure(error) {
  return FAILURE_HELP[error.code] ?? { title: "This didn't load", message: error.message }
}

export function Notice({ title, children, action }) {
  return (
    <div className="notice">
      <h2>{title}</h2>
      <p>{children}</p>
      {action}
    </div>
  )
}

export function FailedNotice({ error, retry }) {
  const { title, message, link } = explainFailure(error)
  return (
    <Notice
      title={title}
      action={
        link ? (
          <a className="button" href={link.href}>
            {link.label}
          </a>
        ) : (
          <button type="button" className="button" onClick={retry}>
            Try again
          </button>
        )
      }
    >
      {message}
    </Notice>
  )
}
