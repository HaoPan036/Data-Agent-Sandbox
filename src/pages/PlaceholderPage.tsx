interface PlaceholderPageProps {
  title: string;
}

export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <section className="panel">
      <h2>{title}</h2>
      <p>This placeholder is reserved for a later public sandbox stage.</p>
    </section>
  );
}

