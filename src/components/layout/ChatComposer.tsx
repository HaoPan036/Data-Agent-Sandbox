interface ChatComposerProps {
  message?: string;
  onChange: (value: string) => void;
  onRun: () => void;
  onSkills: () => void;
  value: string;
}

export function ChatComposer({
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
        id="topic-question"
        onChange={(event) => onChange(event.target.value)}
        placeholder="Ask a question about this topic..."
        rows={2}
        value={value}
      />
      <div className="composer-actions">
        <button className="button button--ghost" onClick={onSkills} type="button">
          Skills
        </button>
        <button className="button button--primary" onClick={onRun} type="button">
          Run
        </button>
      </div>
    </section>
  );
}
