interface SampleQuestionListProps {
  onSelectQuestion: (question: string) => void;
  questions: string[];
  selectedQuestion: string;
}

export function SampleQuestionList({
  onSelectQuestion,
  questions,
  selectedQuestion
}: SampleQuestionListProps) {
  return (
    <section className="sample-question-panel" id="sample-questions">
      <div>
        <h2>Sample Questions</h2>
        <p>Choose a prompt to prepare the composer. Execution comes in the next stage.</p>
      </div>
      <div className="sample-chip-row">
        {questions.map((question) => (
          <button
            className={question === selectedQuestion ? "sample-chip sample-chip--active" : "sample-chip"}
            key={question}
            onClick={() => onSelectQuestion(question)}
            type="button"
          >
            {question}
          </button>
        ))}
      </div>
    </section>
  );
}
