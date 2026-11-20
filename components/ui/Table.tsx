import { Skeleton } from "@/components/ui/Skeleton";

export function Table({ children, className = "" }: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={`table-stack md:overflow-x-auto md:rounded-xl md:border md:border-[var(--card-border)] ${className}`}
    >
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  );
}

export function TableHead({ children }: React.PropsWithChildren) {
  return (
    <thead className="bg-[var(--surface-sunken)]">
      <tr className="text-start text-[var(--muted)]">{children}</tr>
    </thead>
  );
}

export function TableBody({ children }: React.PropsWithChildren) {
  return <tbody>{children}</tbody>;
}

interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  asChild?: never;
}

export function TableRow({ children, className = "", ...props }: TableRowProps) {
  return (
    <tr
      className={`bg-[var(--surface)] transition-colors duration-150 md:border-t md:border-[var(--border-subtle)] md:hover:bg-[var(--surface-sunken)] ${className}`}
      {...props}
    >
      {children}
    </tr>
  );
}

interface CellProps {
  children?: React.ReactNode;
  align?: "left" | "right";
  className?: string;
  colSpan?: number;
}

export function Th({ children, align = "left", className = "" }: CellProps) {
  return (
    <th
      scope="col"
      className={`px-4 py-3 text-xs font-medium uppercase tracking-wide ${
        align === "right" ? "text-end" : "text-start"
      } ${className}`}
    >
      {children}
    </th>
  );
}

/**
 * `label` is the column name repeated into the mobile card layout. Pass it on every
 * data cell so the stacked view below md stays readable; omit it on action cells.
 */
export function Td({
  children,
  align = "left",
  className = "",
  colSpan,
  label,
}: CellProps & { label?: string }) {
  return (
    <td
      colSpan={colSpan}
      data-label={label}
      className={`px-4 py-3 ${align === "right" ? "md:text-end" : ""} ${className}`}
    >
      {children}
    </td>
  );
}

export function TableSkeletonRows({ rows = 5, columns }: { rows?: number; columns: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <TableRow key={r}>
          {Array.from({ length: columns }).map((_, c) => (
            <Td key={c}>
              <Skeleton className="h-4 w-full max-w-32" />
            </Td>
          ))}
        </TableRow>
      ))}
    </>
  );
}
