interface ActionCardProps {
  active?: boolean;
  description: string;
  label: string;
  onClick: () => void;
}

export function ActionCard({
  active = false,
  description,
  label,
  onClick
}: ActionCardProps) {
  return (
    <button
      className={active ? "action-card action-card--active" : "action-card"}
      onClick={onClick}
      type="button"
    >
      <span className="action-card__label">{label}</span>
      <span className="action-card__description">{description}</span>
    </button>
  );
}

