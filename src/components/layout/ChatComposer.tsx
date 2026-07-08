interface ChatComposerProps {
  message?: string;
  onChange: (value: string) => void;
  onRun: () => void;
  value: string;
}

export function ChatComposer({ message, onChange, onRun, value }: ChatComposerProps) {
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
      <button className="primary-button" onClick={onRun} type="button">
        Run
      </button>
    </section>
  );
}

