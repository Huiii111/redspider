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
  return (
    <Notice
      title="This didn't load"
      action={
        <button type="button" className="button" onClick={retry}>
          Try again
        </button>
      }
    >
      {error.message}
    </Notice>
  )
}
