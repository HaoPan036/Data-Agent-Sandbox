import { Button } from "../ui/Button";

interface TopBarProps {
  pageTitle: string;
}

const actions = ["Run", "Edit", "Share", "Settings"];

export function TopBar({ pageTitle }: TopBarProps) {
  return (
    <header className="top-bar">
      <div>
        <p className="eyebrow">Data Agent Sandbox</p>
        <h1>{pageTitle}</h1>
      </div>
      <div className="top-bar__actions" aria-label="Page actions">
        {actions.map((action) => (
          <Button key={action} variant={action === "Run" ? "primary" : "secondary"}>
            {action}
          </Button>
        ))}
      </div>
    </header>
  );
}
