import { useRef, useState } from "react";
import { Upload, X, FileText, AlertCircle } from "lucide-react";
import { Label } from "./ui/label";
import { cn } from "../lib/utils";
import { useLanguage } from "../context/language-context";

interface FileUploadProps {
  label: string;
  description?: string;
  value: File | null;
  onChange: (file: File | null) => void;
  accept?: string;
  error?: string;
}

export function FileUpload({
  label,
  description,
  value,
  onChange,
  accept = "image/*,.pdf",
  error,
}: FileUploadProps) {
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = (file: File | null) => {
    if (!file) {
      onChange(null);
      setPreview(null);
      return;
    }
    onChange(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-2">
      <Label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
        {label}
      </Label>
      {description && (
        <p className="text-xs text-slate-400">{description}</p>
      )}

      {value ? (
        <div className="glass-card rounded-xl border border-white/10 bg-white/5 p-3 flex items-center gap-3">
          {preview ? (
            <img
              src={preview}
              alt={label}
              className="h-14 w-14 rounded-lg object-cover border border-white/10"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400">
              <FileText className="h-6 w-6" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{value.name}</p>
            <p className="text-xs text-slate-400">
              {(value.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleFile(null)}
            className="rounded-lg p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            aria-label={t("common.removeFile")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className={cn(
            "w-full rounded-xl border-2 border-dashed border-white/10 bg-white/5 p-4 flex flex-col items-center justify-center gap-2 text-center transition-all hover:border-blue-500/40 hover:bg-white/10 interactive-scale",
            error && "border-red-500/50 hover:border-red-500/60"
          )}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
            <Upload className="h-5 w-5" />
          </div>
          <span className="text-sm font-medium text-slate-200">{label}</span>
          <span className="text-xs text-slate-500">{description}</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0] || null)}
      />

      {error && (
        <p className="text-xs text-red-400 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}
