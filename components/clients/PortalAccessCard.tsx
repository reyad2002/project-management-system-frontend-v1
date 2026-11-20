"use client";

import { useEffect, useState } from "react";
import { UserPlus, Trash2, KeyRound, Copy, Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { InvitePortalUserForm, type InvitePortalUserFormData } from "@/components/clients/InvitePortalUserForm";
import { useClientPortalUsers, useInviteClientPortalUser, useRevokeClientPortalUser } from "@/hooks/use-client-portal";
import { portalUserStatusVariant } from "@/lib/status-badges";

function CopyLinkButton({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(t);
  }, [copied]);

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => {
        navigator.clipboard.writeText(link);
        setCopied(true);
      }}
    >
      {copied ? (
        <>
          <Check className="me-1.5 h-3.5 w-3.5 text-(--success)" />
          Copied
        </>
      ) : (
        <>
          <Copy className="me-1.5 h-3.5 w-3.5" />
          Copy link
        </>
      )}
    </Button>
  );
}

const FORM_ID = "invite-portal-user-form";

interface PortalAccessCardProps {
  clientId: string;
}

export function PortalAccessCard({ clientId }: PortalAccessCardProps) {
  const { data } = useClientPortalUsers(clientId);
  const invite = useInviteClientPortalUser(clientId);
  const revoke = useRevokeClientPortalUser(clientId);

  const [modalOpen, setModalOpen] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [justInvited, setJustInvited] = useState<{ name: string; link: string } | null>(null);

  const portalUsers = data?.portalUsers ?? [];

  const handleInvite = async (formData: InvitePortalUserFormData) => {
    const created = await invite.mutateAsync(formData);
    setModalOpen(false);
    if (created.invite_link) {
      setJustInvited({ name: created.name, link: created.invite_link });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-[var(--muted)]" />
          Portal access
        </CardTitle>
        <Button size="sm" onClick={() => setModalOpen(true)}>
          <UserPlus className="me-2 h-4 w-4" />
          Invite to portal
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {justInvited && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-(--border) bg-(--accent-muted) px-3 py-2 text-sm">
            <div className="min-w-0">
              <p className="font-medium text-(--foreground)">
                Invite email sent to {justInvited.name}
              </p>
              <p className="truncate text-xs text-(--muted)">
                You can also send this link manually: {justInvited.link}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <CopyLinkButton link={justInvited.link} />
              <Button type="button" variant="ghost" size="sm" onClick={() => setJustInvited(null)} aria-label="Dismiss">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {portalUsers.length === 0 ? (
          <p className="text-[var(--muted)]">No portal contacts invited yet.</p>
        ) : (
          <ul className="space-y-2">
            {portalUsers.map((pu) => (
              <li
                key={pu.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[var(--muted-bg)] px-3 py-2 text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{pu.name}</span>
                  <span className="text-[var(--muted)]">{pu.email}</span>
                  <Badge variant={portalUserStatusVariant[pu.status]}>{pu.status}</Badge>
                </div>
                <div className="flex items-center gap-1">
                  {pu.invite_link && <CopyLinkButton link={pu.invite_link} />}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                    onClick={() => setRevokingId(pu.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Invite to client portal"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form={FORM_ID} loading={invite.isPending}>
              Send invite
            </Button>
          </>
        }
      >
        <InvitePortalUserForm formId={FORM_ID} onSubmit={handleInvite} />
      </Modal>

      <ConfirmDialog
        open={!!revokingId}
        title="Revoke portal access?"
        description="This contact will no longer be able to sign in to the client portal."
        confirmText="Revoke"
        isLoading={revoke.isPending}
        onClose={() => setRevokingId(null)}
        onConfirm={() => {
          if (!revokingId) return;
          revoke.mutate(revokingId, { onSuccess: () => setRevokingId(null) });
        }}
      />
    </Card>
  );
}
