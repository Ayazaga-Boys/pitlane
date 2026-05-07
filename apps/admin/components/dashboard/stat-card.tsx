import { Activity, LifeBuoy, MapPinned, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, StatValue } from "@/components/ui/card";
import type { DashboardStat } from "@/lib/dashboard";

const toneClasses: Record<DashboardStat["tone"], string> = {
  brand: "bg-pit-red/12 text-pit-red-soft",
  info: "bg-info/12 text-info",
  warning: "bg-warning/12 text-warning",
  success: "bg-success/12 text-success",
};

const icons = {
  users: Users,
  flares: Activity,
  help: LifeBuoy,
  pins: MapPinned,
};

export function StatCard({ stat }: { stat: DashboardStat }) {
  const Icon = icons[stat.key];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between gap-md">
        <div className="space-y-xs">
          <CardTitle>{stat.label}</CardTitle>
          <p className="text-xs leading-5 text-text-tertiary">{stat.detail}</p>
        </div>
        <div className={`inline-flex size-11 items-center justify-center rounded-pill ${toneClasses[stat.tone]}`}>
          <Icon aria-hidden="true" className="size-5" />
        </div>
      </CardHeader>
      <CardContent>
        <StatValue>{stat.value.toLocaleString("tr-TR")}</StatValue>
      </CardContent>
    </Card>
  );
}
