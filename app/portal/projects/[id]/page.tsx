"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";
import { usePortalProject, useApprovePhase } from "@/hooks/use-portal";
import { projectStatusVariant } from "@/lib/status-badges";
import { PortalMeetingsTab } from "@/components/portal/PortalMeetingsTab";
import { PortalProjectLinksTab } from "@/components/portal/PortalProjectLinksTab";
import { PortalCredentialsTab } from "@/components/portal/PortalCredentialsTab";
import { PendingOnClientTab } from "@/components/portal/PendingOnClientTab";
import { FeedbackModal } from "@/components/portal/FeedbackModal";

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency: "EGP",
    minimumFractionDigits: 0,
  }).format(n);
}

export default function PortalProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: project, isLoading, error } = usePortalProject(id);
  const approvePhase = useApprovePhase(id);
  const [feedbackTarget, setFeedbackTarget] = useState<{ type: "meeting" | "phase"; id: string } | null>(null);

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
        <Button variant="outline" size="sm" className="ml-4" onClick={() => router.push("/portal")}>
          Back to projects
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/portal">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>{project.title}</CardTitle>
            <Badge variant={projectStatusVariant[project.status]}>{project.status.replace("_", " ")}</Badge>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4 text-sm">
          {project.start_date && (
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-(--muted)" />
              Start: {project.start_date}
            </span>
          )}
          {project.due_date && (
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-(--muted)" />
              Due: {project.due_date}
            </span>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 sm:p-6">
          <Tabs
            tabs={[
              {
                key: "phases",
                label: "Phases",
                content:
                  project.phases.length === 0 ? (
                    <p className="text-(--muted)">No phases published yet.</p>
                  ) : (
                    <ul className="space-y-2">
                      {project.phases.map((ph) => (
                        <li
                          key={ph.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-(--muted-bg) px-3 py-2 text-sm"
                        >
                          <div>
                            <span className="font-medium">{ph.title}</span>
                            <span className="mx-2 text-(--muted)">·</span>
                            <span>
                              {ph.start_date} – {ph.end_date}
                            </span>
                            <span className="mx-2 text-(--muted)">·</span>
                            <span className="font-medium">{formatMoney(ph.amount)}</span>
                          </div>
                          {ph.client_approved_at ? (
                            <span className="flex items-center gap-1.5 text-xs font-medium text-(--success)">
                              <CheckCircle2 className="h-4 w-4" />
                              Approved
                            </span>
                          ) : (
                            <Button
                              size="sm"
                              loading={approvePhase.isPending}
                              onClick={() =>
                                approvePhase.mutate(ph.id, {
                                  onSuccess: () => setFeedbackTarget({ type: "phase", id: ph.id }),
                                })
                              }
                            >
                              Approve this phase
                            </Button>
                          )}
                        </li>
                      ))}
                    </ul>
                  ),
              },
              {
                key: "meetings",
                label: "Meetings",
                content: (
                  <PortalMeetingsTab
                    projectId={id}
                    onNoteFirstRead={(noteId) => setFeedbackTarget({ type: "meeting", id: noteId })}
                  />
                ),
              },
              {
                key: "links",
                label: "Links",
                content: <PortalProjectLinksTab projectId={id} />,
              },
              {
                key: "credentials",
                label: "Credentials",
                content: <PortalCredentialsTab projectId={id} />,
              },
              {
                key: "pending",
                label: "For you",
                content: <PendingOnClientTab projectId={id} />,
              },
            ]}
          />
        </CardContent>
      </Card>

      <FeedbackModal
        open={!!feedbackTarget}
        onClose={() => setFeedbackTarget(null)}
        projectId={id}
        relatedType={feedbackTarget?.type ?? "phase"}
        relatedId={feedbackTarget?.id ?? ""}
      />
    </div>
  );
}
