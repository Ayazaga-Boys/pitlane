import Link from "next/link";
import { cancelCommunityEvent } from "@/app/(dashboard)/events/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableWrapper, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import type { AdminCommunityEvent } from "@/lib/admin-data";

function mapStatus(status: AdminCommunityEvent["status"]) {
  if (status === "completed") return { label: "tamamlandı", tone: "default" as const };
  if (status === "canceled") return { label: "iptal", tone: "error" as const };
  return { label: "planlandı", tone: "success" as const };
}

export function EventsTable({ events, usingMockData }: { events: AdminCommunityEvent[]; usingMockData: boolean }) {
  return (
    <TableWrapper>
      <Table>
        <THead>
          <TR>
            <TH>Etkinlik</TH>
            <TH>Topluluk</TH>
            <TH>Başlangıç</TH>
            <TH>Katılım</TH>
            <TH>Risk</TH>
            <TH>Durum</TH>
            <TH>Aksiyon</TH>
          </TR>
        </THead>
        <TBody>
          {events.length > 0 ? (
            events.map((event) => {
              const status = mapStatus(event.status);

              return (
                <TR key={event.id}>
                  <TD>
                    <div>
                      <p className="font-medium text-text-primary">{event.title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-xs text-xs text-text-tertiary">
                        <span>Oluşturan: {event.creatorName}</span>
                        <Link className="focus-ring rounded-xs text-text-primary hover:text-pit-red" href={`/users/${event.creatorId}`}>
                          kullanıcıya git
                        </Link>
                      </div>
                    </div>
                  </TD>
                  <TD>{event.communityName}</TD>
                  <TD>{event.startsAt}</TD>
                  <TD>
                    {event.attendeesYes} evet / {event.attendeesMaybe} belki
                  </TD>
                  <TD>
                    <div className="flex flex-wrap gap-xs">
                      <Badge tone={event.suspicious ? "warning" : "default"}>
                        {event.suspicious ? "şüpheli" : "normal"}
                      </Badge>
                      <Badge tone={event.priorityLabel === "kritik" ? "error" : event.priorityLabel === "incele" ? "warning" : "default"}>
                        {event.priorityLabel}
                      </Badge>
                      {event.reportsCount > 0 ? <Badge tone="error">{event.reportsCount} sinyal</Badge> : null}
                    </div>
                    {event.suspiciousReason ? <p className="mt-1 text-xs text-text-tertiary">{event.suspiciousReason}</p> : null}
                  </TD>
                  <TD>
                    <Badge tone={status.tone}>{status.label}</Badge>
                  </TD>
                  <TD>
                    {event.status === "scheduled" ? (
                      <form action={cancelCommunityEvent} className="space-y-sm">
                        <input name="eventId" type="hidden" value={event.id} />
                        <input
                          name="reason"
                          type="hidden"
                          value={
                            event.suspicious
                              ? "Yuksek RSVP hacmi ve risk sinyali nedeniyle etkinlik admin tarafindan iptal edildi."
                              : "Etkinlik moderasyon karariyla iptal edildi."
                          }
                        />
                        <Button
                          disabled={usingMockData || !event.suspicious}
                          type="submit"
                          variant="destructive"
                        >
                          {usingMockData ? "Mock mod" : event.suspicious ? "Etkinliği iptal et" : "Temiz"}
                        </Button>
                      </form>
                    ) : (
                      <span className="text-xs text-text-tertiary">Aksiyon yok</span>
                    )}
                  </TD>
                </TR>
              );
            })
          ) : (
            <TR>
              <TD className="py-xl text-sm text-text-secondary" colSpan={7}>
                Yaklaşan etkinlik bulunmuyor.
              </TD>
            </TR>
          )}
        </TBody>
      </Table>
    </TableWrapper>
  );
}
