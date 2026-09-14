export type BadgeVariant = "neutral" | "info" | "warning" | "success" | "danger" | "cancelled";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: boolean;
}

const variantClasses: Record<NonNullable<BadgeProps["variant"]>, string> = {
  neutral: "border-[var(--border)] bg-[var(--muted-bg)] text-[var(--muted)]",
  info: "border-[var(--info)]/20 bg-[var(--info-bg)] text-[var(--info)]",
  warning: "border-[var(--caution)]/25 bg-[var(--caution-bg)] text-[var(--caution)]",
  success: "border-[var(--positive)]/25 bg-[var(--positive-bg)] text-[var(--positive)]",
  danger: "border-[var(--negative)]/25 bg-[var(--negative-bg)] text-[var(--negative)]",
  cancelled: "border-[var(--border)] bg-[var(--muted-bg)] text-[var(--muted)] line-through",
};

const dotClasses: Record<NonNullable<BadgeProps["variant"]>, string> = {
  neutral: "bg-[var(--muted)]",
  info: "bg-[var(--info)]",
  warning: "bg-[var(--caution)]",
  success: "bg-[var(--positive)]",
  danger: "bg-[var(--negative)]",
  cancelled: "bg-[var(--muted)]",
};

export function Badge({ className = "", variant = "neutral", dot = true, children, ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize leading-5 ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {dot && <span aria-hidden className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotClasses[variant]}`} />}
      {children}
    </span>
  );
}
