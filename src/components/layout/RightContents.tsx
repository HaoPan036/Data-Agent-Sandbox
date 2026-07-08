interface RightContentsProps {
  items: string[];
}

export function RightContents({ items }: RightContentsProps) {
  return (
    <aside className="right-contents" aria-label="Contents">
      <h2>Contents</h2>
      <ol>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ol>
    </aside>
  );
}

