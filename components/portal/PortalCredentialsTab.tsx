"use client";

import { Table, TableHead, TableBody, TableRow, Th, Td } from "@/components/ui/Table";
import { usePortalCredentials, useRevealPortalCredential } from "@/hooks/use-portal";
import { RevealPasswordCell } from "@/components/credentials/RevealPasswordCell";

interface PortalCredentialsTabProps {
  projectId: string;
}

export function PortalCredentialsTab({ projectId }: PortalCredentialsTabProps) {
  const { data, isLoading } = usePortalCredentials(projectId);
  const reveal = useRevealPortalCredential();
  const credentials = data?.credentials ?? [];

  if (isLoading) return <p className="text-(--muted)">Loading credentials...</p>;
  if (credentials.length === 0) return <p className="text-(--muted)">No credentials shared for this project yet.</p>;

  return (
    <Table>
      <TableHead>
        <Th>Label</Th>
        <Th>Username</Th>
        <Th>Password</Th>
        <Th>Panel</Th>
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
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
