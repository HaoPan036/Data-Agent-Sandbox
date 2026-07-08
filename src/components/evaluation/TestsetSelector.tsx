import type { EvaluationTestset } from "../../evaluation/evaluationTypes";

interface TestsetSelectorProps {
  onChange: (testsetId: string) => void;
  selectedTestsetId: string;
  testsets: EvaluationTestset[];
}

export function TestsetSelector({ onChange, selectedTestsetId, testsets }: TestsetSelectorProps) {
  return (
    <label className="testset-selector">
      <span>Testset version</span>
      <select onChange={(event) => onChange(event.target.value)} value={selectedTestsetId}>
        {testsets.map((testset) => (
          <option key={`${testset.id}:${testset.version}`} value={testset.id}>
            {testset.name} {testset.version}
          </option>
        ))}
      </select>
    </label>
  );
}
