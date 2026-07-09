interface ChatComposerProps {
  isRunning?: boolean;
  message?: string;
  onChange: (value: string) => void;
  onRun: () => void;
  onSkills: () => void;
  value: string;
}

export function ChatComposer({
  isRunning = false,
  message,
  onChange,
  onRun,
  onSkills,
  value
}: ChatComposerProps) {
  return (
    <section className="chat-composer" aria-label="Topic question composer">
      {message ? <p className="composer-message">{message}</p> : null}
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
        <button className="button button--primary" disabled={isRunning} onClick={onRun} type="button">
          {isRunning ? "Running..." : "Run"}
        </button>
      </div>
    </section>
  );
}
