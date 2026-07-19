interface ChatComposerProps {
  canRun?: boolean;
  isRunning?: boolean;
  message?: string;
  onChange: (value: string) => void;
  onCancel?: () => void;
  onRun: () => void;
  onSkills: () => void;
  showRetry?: boolean;
  value: string;
}

export function ChatComposer({
  canRun = true,
  isRunning = false,
  message,
  onChange,
  onCancel,
  onRun,
  onSkills,
  showRetry = false,
  value
}: ChatComposerProps) {
  return (
    <section className="chat-composer" aria-label="Topic question composer">
      {message ? <p aria-live="polite" className="composer-message" role="status">{message}</p> : null}
      <label className="visually-hidden" htmlFor="topic-question">
        Topic question
      </label>
      <textarea
        disabled={isRunning}
        id="topic-question"
        onChange={(event) => onChange(event.target.value)}
        placeholder="Ask a question about this topic..."
        rows={2}
        value={value}
      />
      <div className="composer-actions">
        <button className="button button--ghost" disabled={isRunning} onClick={onSkills} type="button">
          Skills
        </button>
        {isRunning ? (
          <button className="button button--secondary" onClick={onCancel} type="button">
            Cancel
          </button>
        ) : (
          <button className="button button--primary" disabled={!canRun} onClick={onRun} type="button">
            {showRetry ? "Retry" : "Run"}
          </button>
        )}
      </div>
    </section>
  );
}
