import { Badge } from "@/components/ui/badge";
import { Table, TableWrapper, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import type { AdminCommunityEvent } from "@/lib/admin-data";

function mapStatus(status: AdminCommunityEvent["status"]) {
  if (status === "completed") return { label: "tamamlandı", tone: "default" as const };
  if (status === "canceled") return { label: "iptal", tone: "error" as const };
  return { label: "planlandı", tone: "success" as const };
}

export function EventsTable({ events }: { events: AdminCommunityEvent[] }) {
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
                      <p className="mt-1 text-xs text-text-tertiary">Oluşturan: {event.creatorName}</p>
                    </div>
                  </TD>
                  <TD>{event.communityName}</TD>
                  <TD>{event.startsAt}</TD>
                  <TD>
                    {event.attendeesYes} evet / {event.attendeesMaybe} maybe
                  </TD>
                  <TD>
                    <div className="flex flex-wrap gap-xs">
                      <Badge tone={event.suspicious ? "warning" : "default"}>
                        {event.suspicious ? "şüpheli" : "normal"}
                      </Badge>
                      {event.reportsCount > 0 ? <Badge tone="error">{event.reportsCount} sinyal</Badge> : null}
                    </div>
                  </TD>
                  <TD>
                    <Badge tone={status.tone}>{status.label}</Badge>
                  </TD>
                </TR>
              );
            })
          ) : (
            <TR>
              <TD className="py-xl text-sm text-text-secondary" colSpan={6}>
                Yaklaşan etkinlik bulunmuyor.
              </TD>
            </TR>
          )}
        </TBody>
      </Table>
    </TableWrapper>
  );
}
