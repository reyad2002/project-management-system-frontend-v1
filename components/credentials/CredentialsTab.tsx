"use client";

import { useState } from "react";
import { Plus, History } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Table, TableHead, TableBody, TableRow, Th, Td } from "@/components/ui/Table";
import { useCredentials, useRevealCredential } from "@/hooks/use-credentials";
import { RevealPasswordCell } from "@/components/credentials/RevealPasswordCell";
import { CredentialFormModal } from "@/components/credentials/CredentialFormModal";
import { CredentialAccessLogModal } from "@/components/credentials/CredentialAccessLogModal";

interface CredentialsTabProps {
  projectId: string;
}

export function CredentialsTab({ projectId }: CredentialsTabProps) {
  const { data, isLoading } = useCredentials(projectId);
  const reveal = useRevealCredential();
  const [formOpen, setFormOpen] = useState(false);
  const [logCredentialId, setLogCredentialId] = useState<string | null>(null);

  const credentials = data?.credentials ?? [];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add credential
        </Button>
      </div>

      {isLoading ? (
        <p className="text-(--muted)">Loading credentials...</p>
      ) : credentials.length === 0 ? (
        <p className="text-(--muted)">No credentials stored for this project yet.</p>
      ) : (
        <Table>
          <TableHead>
            <Th>Label</Th>
            <Th>Username</Th>
            <Th>Password</Th>
            <Th>Panel</Th>
            <Th align="right">Actions</Th>
          </TableHead>
          <TableBody>
            {credentials.map((cred) => (
              <TableRow key={cred.id}>
                <Td className="font-medium">{cred.label}</Td>
                <Td>{cred.username}</Td>
                <Td>
                  <RevealPasswordCell onReveal={() => reveal.mutateAsync(cred.id)} />
                </Td>
                <Td>
                  {cred.panel_url ? (
                    <a href={cred.panel_url} target="_blank" rel="noopener noreferrer" className="text-(--primary) hover:underline">
                      Open
                    </a>
                  ) : (
                    <span className="text-(--muted)">—</span>
                  )}
                </Td>
                <Td align="right">
                  <Button variant="ghost" size="sm" onClick={() => setLogCredentialId(cred.id)}>
                    <History className="h-4 w-4" />
                  </Button>
                </Td>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <CredentialFormModal open={formOpen} onClose={() => setFormOpen(false)} projectId={projectId} />
      <CredentialAccessLogModal
        open={!!logCredentialId}
        onClose={() => setLogCredentialId(null)}
        credentialId={logCredentialId}
      />
    </div>
  );
}
