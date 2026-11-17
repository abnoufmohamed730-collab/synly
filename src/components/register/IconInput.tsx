import type { LucideIcon } from "lucide-react";
import { Input } from "../ui/input";
import { FormField } from "./FormField";

interface IconInputProps {
  id: string;
  label: string;
  icon: LucideIcon;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
}

export function IconInput({
  id,
  label,
  icon: Icon,
  placeholder,
  value,
  onChange,
  error,
  type = "text",
}: IconInputProps) {
  return (
    <FormField label={label} htmlFor={id} error={error}>
      <div className="relative">
        <Icon className="absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
        <Input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="glass-input h-11 ps-10 pe-4 interactive-scale"
        />
      </div>
    </FormField>
  );
}
