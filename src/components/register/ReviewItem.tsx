export function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-medium text-white truncate">{value || "—"}</p>
    </div>
  );
}
