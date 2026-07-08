import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  id?: string;
}

export function Card({ children, className = "", id }: CardProps) {
  return (
    <section className={["card", className].filter(Boolean).join(" ")} id={id}>
      {children}
    </section>
  );
}

