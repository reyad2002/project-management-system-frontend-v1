"use client";

import { useState } from "react";
import { Mail, MessageCircle, Phone, Trash2, UserRound, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { useClientContacts, useDeleteContact, useLogContact } from "@/hooks/use-insights";
import { useAuth } from "@/lib/auth-context";
import { canSeeAllTasks } from "@/lib/permissions";
import type { ContactKind } from "@/lib/api";

const KINDS: { value: ContactKind; label: string; icon: typeof Phone }[] = [
  { value: "call", label: "Phone call", icon: Phone },
  { value: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { value: "email", label: "Email", icon: Mail },
  { value: "meeting", label: "Meeting", icon: Users },
  { value: "visit", label: "Visit", icon: UserRound },
  { value: "other", label: "Other", icon: UserRound },
];

function when(iso: string) {
  const d = new Date(iso);
  return `${d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;
}

/** The client's contact log: "called them Tuesday, they asked for a quote". It feeds the client health score. */
export function ContactLog({ clientId }: { clientId: string }) {
  const { user } = useAuth();
  const { data } = useClientContacts(clientId);
  const log = useLogContact(clientId);
  const remove = useDeleteContact(clientId);
  const [kind, setKind] = useState<ContactKind>("call");
  const [note, setNote] = useState("");

  const contacts = data?.contacts ?? [];
  const manager = canSeeAllTasks(user);

  const submit = async () => {
    await log.mutateAsync({ kind, note: note.trim() || undefined });
    setNote("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact log</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div className="flex flex-wrap items-end gap-2">
          <div className="w-40">
            <Select label="How" options={KINDS.map((k) => ({ value: k.value, label: k.label }))} value={kind} onChange={(e) => setKind(e.target.value as ContactKind)} />
          </div>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), void submit())}
            placeholder="What was said (optional)"
            aria-label="Note"
            maxLength={1000}
            className="h-10 min-w-0 flex-1 rounded-lg border border-(--border) bg-(--card) px-3 text-base text-(--foreground) outline-none placeholder:text-(--muted) focus:border-(--ring) focus:ring-2 focus:ring-(--ring)/20 sm:text-sm"
          />
          <Button loading={log.isPending} onClick={submit}>
            Log contact
          </Button>
        </div>

        {contacts.length === 0 ? (
          <p className="text-sm text-(--muted)">Nothing logged yet. Log each call or message so you can see how long it has been.</p>
        ) : (
          <ul className="divide-y divide-(--border-subtle)">
            {contacts.map((c) => {
              const kindInfo = KINDS.find((k) => k.value === c.kind) ?? KINDS[5];
              const Icon = kindInfo.icon;
              const mine = String(c.user_id) === String(user?.id);
              return (
                <li key={c.id} className="flex items-start gap-3 py-2.5">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-(--muted)" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-(--foreground)">
                      <span className="font-medium">{kindInfo.label}</span>
                      <span className="text-(--muted)"> · {when(c.contacted_at)}{c.user_name ? ` · ${c.user_name}` : ""}</span>
                    </p>
                    {c.note && <p className="whitespace-pre-wrap break-words text-sm text-(--muted)">{c.note}</p>}
                  </div>
                  {(mine || manager) && (
                    <button type="button" aria-label="Delete contact" onClick={() => remove.mutate(c.id)} className="shrink-0 rounded p-1 text-(--muted) hover:text-(--destructive)">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
