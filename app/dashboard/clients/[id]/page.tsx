"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useClient } from "@/hooks/use-clients";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Mail, Phone, MapPin, FileText } from "lucide-react";

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: client, isLoading, error } = useClient(id);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="rounded-lg border border-[var(--destructive)] bg-red-50 p-4 text-[var(--destructive)]">
        Client not found.
        <Button variant="outline" size="sm" className="ml-4" onClick={() => router.push("/dashboard/clients")}>
          Back to list
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/clients">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{client.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {client.email && (
            <div className="flex items-center gap-2 text-[var(--foreground)]">
              <Mail className="h-4 w-4 text-[var(--muted)]" />
              <a href={`mailto:${client.email}`} className="text-[var(--primary)] hover:underline">
                {client.email}
              </a>
            </div>
          )}
          {client.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-[var(--muted)]" />
              <span>{client.phone}</span>
            </div>
          )}
          {client.address && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[var(--muted)]" />
              <span>{client.address}</span>
            </div>
          )}
          {(client.notes || client.feedback) && (
            <div className="flex items-start gap-2 border-t border-[var(--border)] pt-4">
              <FileText className="h-4 w-4 shrink-0 text-[var(--muted)]" />
              <div className="space-y-1 text-sm">
                {client.notes && <p><span className="text-[var(--muted)]">Notes:</span> {client.notes}</p>}
                {client.feedback && <p><span className="text-[var(--muted)]">Feedback:</span> {client.feedback}</p>}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Link href={`/dashboard/projects?client_id=${client.id}`}>
          <Button variant="secondary">View projects</Button>
        </Link>
      </div>
    </div>
  );
}
