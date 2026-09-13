export type BadgeVariant = "neutral" | "info" | "warning" | "success" | "danger" | "cancelled";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: boolean;
}

const variantClasses: Record<NonNullable<BadgeProps["variant"]>, string> = {
  neutral: "bg-[var(--muted-bg)] text-[var(--muted)]",
  info: "bg-[var(--accent-muted)] text-[var(--primary)]",
  warning: "bg-[var(--warning-bg)] text-[var(--warning)]",
  success: "bg-[var(--success-bg)] text-[var(--success)]",
  danger: "bg-[var(--destructive-bg)] text-[var(--destructive)]",
  cancelled: "bg-[var(--muted-bg)] text-[var(--muted)] line-through opacity-70",
};

const dotClasses: Record<NonNullable<BadgeProps["variant"]>, string> = {
  neutral: "bg-[var(--muted)]",
  info: "bg-[var(--primary)]",
  warning: "bg-[var(--warning)]",
  success: "bg-[var(--success)]",
  danger: "bg-[var(--destructive)]",
  cancelled: "bg-[var(--muted)]",
};

export function Badge({ className = "", variant = "neutral", dot = true, children, ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium capitalize ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {dot && <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotClasses[variant]}`} />}
      {children}
    </span>
  );
}
