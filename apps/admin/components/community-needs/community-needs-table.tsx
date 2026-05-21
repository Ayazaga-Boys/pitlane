import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableWrapper, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import type { AdminCommunityNeed } from "@/lib/admin-data";
import { suspendCommunityNeedCreator } from "@/app/(dashboard)/community-needs/actions";

function mapType(type: AdminCommunityNeed["type"]) {
  switch (type) {
    case "parts":
      return "parça";
    case "fuel":
      return "yakıt";
    case "tools":
      return "ekipman";
    case "ride_help":
      return "sürüş yardımı";
    default:
      return "diğer";
  }
}

export function CommunityNeedsTable({ needs, usingMockData }: { needs: AdminCommunityNeed[]; usingMockData: boolean }) {
  return (
    <TableWrapper>
      <Table>
        <THead>
          <TR>
            <TH>İlan</TH>
            <TH>Topluluk</TH>
            <TH>Tür</TH>
            <TH>Urgency</TH>
            <TH>Spam sinyali</TH>
            <TH>Durum</TH>
            <TH>Aksiyon</TH>
          </TR>
        </THead>
        <TBody>
          {needs.length > 0 ? (
            needs.map((need) => (
              <TR key={need.id}>
                <TD>
                  <div>
                    <p className="font-medium text-text-primary">{need.body}</p>
                    <p className="mt-1 text-xs text-text-tertiary">
                      {need.creatorName} · @{need.creatorUsername} · {need.createdAt}
                    </p>
                  </div>
                </TD>
                <TD>{need.communityName}</TD>
                <TD>{mapType(need.type)}</TD>
                <TD>
                  <Badge tone={need.urgencyColor === "red" ? "error" : "warning"}>{need.urgencyColor}</Badge>
                </TD>
                <TD>
                  <div className="flex flex-wrap gap-xs">
                    <Badge tone={need.flaggedAsSpam ? "error" : "default"}>{need.createdWithin24h}/24s</Badge>
                    {need.flaggedAsSpam ? <Badge tone="warning">flag</Badge> : null}
                    {need.creatorStatus === "suspended" ? <Badge tone="default">creator askıda</Badge> : null}
                  </div>
                </TD>
                <TD>
                  <Badge tone={need.status === "open" ? "success" : need.status === "resolved" ? "info" : "default"}>{need.status}</Badge>
                </TD>
                <TD>
                  <div className="flex flex-wrap gap-sm">
                    <Link
                      className="focus-ring inline-flex min-h-11 items-center justify-center rounded-sm bg-surface-3 px-md py-sm text-sm font-semibold text-text-primary"
                      href={`/users/${need.creatorId}`}
                    >
                      Kullanıcı
                    </Link>
                    {need.flaggedAsSpam ? (
                      <form action={suspendCommunityNeedCreator}>
                        <input name="userId" type="hidden" value={need.creatorId} />
                        <Button
                          disabled={usingMockData || need.creatorStatus === "suspended"}
                          type="submit"
                          variant="destructive"
                        >
                          {need.creatorStatus === "suspended" ? "Askıda" : "7 gün suspend"}
                        </Button>
                      </form>
                    ) : null}
                  </div>
                </TD>
              </TR>
            ))
          ) : (
            <TR>
              <TD className="py-xl text-sm text-text-secondary" colSpan={7}>
                Gösterilecek community need bulunmuyor.
              </TD>
            </TR>
          )}
        </TBody>
      </Table>
    </TableWrapper>
  );
}
