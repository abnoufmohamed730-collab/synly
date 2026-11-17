import { AlertCircle } from "lucide-react";

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-xs text-red-400 flex items-center gap-1">
      <AlertCircle className="h-3 w-3" />
      {message}
    </p>
  );
}
