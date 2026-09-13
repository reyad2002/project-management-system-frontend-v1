import { Skeleton } from "@/components/ui/Skeleton";

export function Table({ children, className = "" }: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div className={`overflow-x-auto rounded-xl border border-(--card-border) ${className}`}>
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

export function TableHead({ children }: React.PropsWithChildren) {
  return (
    <thead className="bg-(--muted-bg)">
      <tr className="text-left text-(--muted)">{children}</tr>
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
      className={`border-t border-(--card-border) odd:bg-(--card) even:bg-(--muted-bg)/40 transition-colors hover:bg-sky-50/40 ${className}`}
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
    <th className={`px-4 py-3 font-medium ${align === "right" ? "text-right" : ""} ${className}`}>
      {children}
    </th>
  );
}

export function Td({ children, align = "left", className = "", colSpan }: CellProps) {
  return (
    <td colSpan={colSpan} className={`px-4 py-3 ${align === "right" ? "text-right" : ""} ${className}`}>
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
