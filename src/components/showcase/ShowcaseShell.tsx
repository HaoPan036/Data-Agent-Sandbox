import type { ReactNode } from "react";
import { ShowcaseCaptureNav } from "./ShowcaseCaptureNav";

interface ShowcaseShellProps {
  capture: boolean;
  children: ReactNode;
  view: "agent" | "guardrail" | "evaluation";
}

export function ShowcaseShell({ capture, children, view }: ShowcaseShellProps) {
  return (
    <main className={capture ? "showcase-page showcase-page--capture" : "showcase-page"}>
      {capture ? null : <ShowcaseCaptureNav activeView={view} />}
      {children}
    </main>
  );
}
