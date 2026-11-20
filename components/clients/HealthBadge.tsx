import { Badge } from "@/components/ui/Badge";
import type { HealthLevel } from "@/lib/api";

const LABEL: Record<HealthLevel, string> = { healthy: "Healthy", watch: "Needs a look", at_risk: "At risk" };
const VARIANT = { healthy: "success", watch: "warning", at_risk: "danger" } as const;

/** The client's health level as a small badge ("At risk · 42"). */
export function HealthBadge({ level, score }: { level: HealthLevel; score?: number }) {
  return (
    <Badge variant={VARIANT[level]} dot={false}>
      {LABEL[level]}
      {score !== undefined && ` · ${score}`}
    </Badge>
  );
}

export const healthLabel = (level: HealthLevel) => LABEL[level];
