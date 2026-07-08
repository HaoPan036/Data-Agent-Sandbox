interface ShowcaseHeaderProps {
  label: string;
  subtitle: string;
  title: string;
}

export function ShowcaseHeader({ label, subtitle, title }: ShowcaseHeaderProps) {
  return (
    <header className="showcase-header">
      <p className="showcase-eyebrow">{label}</p>
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </header>
  );
}
