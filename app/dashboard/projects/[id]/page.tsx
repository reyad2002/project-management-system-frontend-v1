"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useProject, useProjectPayments } from "@/hooks/use-projects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Calendar, DollarSign } from "lucide-react";

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(n);
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: project, isLoading, error } = useProject(id);
  const { data: paymentsData } = useProjectPayments(id);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="rounded-lg border border-[var(--destructive)] bg-red-50 p-4 text-[var(--destructive)]">
        Project not found.
        <Button variant="outline" size="sm" className="ml-4" onClick={() => router.push("/dashboard/projects")}>
          Back to list
        </Button>
      </div>
    );
  }

  const payments = paymentsData?.payments ?? [];
  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
  const remaining = (project.price ?? 0) - totalPaid;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/projects">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{project.title}</CardTitle>
          <p className="mt-1 text-sm capitalize text-[var(--muted)]">{project.status.replace("_", " ")}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {project.details && <p className="text-[var(--foreground)]">{project.details}</p>}
          <div className="flex flex-wrap gap-4 text-sm">
            {project.start_date && (
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[var(--muted)]" />
                Start: {project.start_date}
              </span>
            )}
            {project.due_date && (
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[var(--muted)]" />
                Due: {project.due_date}
              </span>
            )}
            {project.price != null && (
              <span className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-[var(--muted)]" />
                Price: {formatMoney(project.price)}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payments</CardTitle>
          <p className="text-sm text-[var(--muted)]">
            Total paid: {formatMoney(totalPaid)} · Remaining: {formatMoney(remaining)}
          </p>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-[var(--muted)]">No payments yet.</p>
          ) : (
            <ul className="space-y-2">
              {payments.map((p) => (
                <li key={p.id} className="flex justify-between rounded-lg bg-[var(--muted-bg)] px-3 py-2 text-sm">
                  <span>{p.payment_date} · {p.payment_method.replace("_", " ")}</span>
                  <span className="font-medium">{formatMoney(p.amount)}</span>
                </li>
              ))}
            </ul>
          )}
          <Link href={`/dashboard/payments?project_id=${project.id}`}>
            <Button variant="secondary" size="sm" className="mt-4">View all payments</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
