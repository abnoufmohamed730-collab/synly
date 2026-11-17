import type { ReactNode } from "react";
import { Label } from "../ui/label";
import { FieldError } from "./FieldError";

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  children: ReactNode;
}

export function FormField({ label, htmlFor, error, children }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <Label
        htmlFor={htmlFor}
        className="text-slate-300 text-xs font-semibold uppercase tracking-wider"
      >
        {label}
      </Label>
      {children}
      <FieldError message={error} />
    </div>
  );
}
