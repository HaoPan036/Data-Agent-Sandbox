interface WarningPanelProps {
  warnings: string[];
}

export function WarningPanel({ warnings }: WarningPanelProps) {
  if (warnings.length === 0) {
    return null;
  }

  return (
    <div className="warning-panel" role="status">
      <strong>Warnings</strong>
      <ul>
        {warnings.map((warning) => (
          <li key={warning}>{warning}</li>
        ))}
      </ul>
    </div>
  );
}
