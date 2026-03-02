interface SummaryRowProps {
  label: string;
  value: string;
  total?: boolean;
}

export function SummaryRow({ label, value, total }: SummaryRowProps) {
  return (
    <div
      className={`flex items-center justify-between py-2.5 border-b border-border last:border-0 ${
        total ? "font-semibold" : ""
      }`}
    >
      <span className={total ? "text-[15px]" : "text-sm text-muted-foreground"}>
        {label}
      </span>
      <span className={total ? "text-[18px] tracking-tight" : "text-sm"}>
        {value}
      </span>
    </div>
  );
}
