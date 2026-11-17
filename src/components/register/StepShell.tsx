import type { ReactNode } from "react";

interface StepShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function StepShell({ title, subtitle, children }: StepShellProps) {
  return (
    <div className="space-y-4">
      <div className="text-center space-y-1">
        <h3 className="text-lg font-bold text-white">{title}</h3>
        {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
