"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Table, TableHead, TableBody, TableRow, Th, Td } from "@/components/ui/Table";
import { useCredentialAccessLog } from "@/hooks/use-credentials";

interface CredentialAccessLogModalProps {
  open: boolean;
  onClose: () => void;
  credentialId: string | null;
}

export function CredentialAccessLogModal({ open, onClose, credentialId }: CredentialAccessLogModalProps) {
  const { data } = useCredentialAccessLog(open ? credentialId : null);
  const logs = data?.logs ?? [];

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title="Access log" size="md" footer={<Button variant="outline" onClick={onClose}>Close</Button>}>
      {logs.length === 0 ? (
        <p className="text-sm text-(--muted)">No one has viewed this password yet.</p>
      ) : (
        <Table>
          <TableHead>
            <Th>Who</Th>
            <Th>When</Th>
          </TableHead>
          <TableBody>
            {logs.map((log, i) => (
              <TableRow key={i}>
                <Td>
                  {log.accessed_by_name}
                  <span className="ms-1 text-xs text-(--muted)">
                    ({log.accessed_by_type === "client_portal_user" ? "client" : "team"})
                  </span>
                </Td>
                <Td>{new Date(log.accessed_at).toLocaleString()}</Td>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Modal>
  );
}
