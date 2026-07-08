import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
}

export function Button({
  children,
  className = "",
  variant = "secondary",
  ...props
}: ButtonProps) {
  const classes = ["button", `button--${variant}`, className].filter(Boolean).join(" ");

  return (
    <button className={classes} type="button" {...props}>
      {children}
    </button>
  );
}

