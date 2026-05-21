import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { AdminCompetition } from "@/lib/admin-data";
import { Table, TableWrapper, TBody, TD, TH, THead, TR } from "@/components/ui/table";

function mapStatus(status: AdminCompetition["status"]) {
  if (status === "voting") return { label: "oylama", tone: "success" as const };
  if (status === "completed") return { label: "tamamlandı", tone: "default" as const };
  if (status === "canceled") return { label: "iptal", tone: "error" as const };
  return { label: "taslak", tone: "warning" as const };
}

export function CompetitionsTable({ competitions }: { competitions: AdminCompetition[] }) {
  return (
    <TableWrapper>
      <Table>
        <THead>
          <TR>
            <TH>Yarışma</TH>
            <TH>Topluluk</TH>
            <TH>Zaman</TH>
            <TH>Katılım</TH>
            <TH>Risk</TH>
            <TH>Durum</TH>
          </TR>
        </THead>
        <TBody>
          {competitions.length > 0 ? (
            competitions.map((competition) => {
              const status = mapStatus(competition.status);
              return (
                <TR key={competition.id}>
                  <TD>
                    <div>
                      <Link className="focus-ring inline-flex rounded-xs font-medium text-text-primary hover:text-pit-red" href={`/competitions/${competition.id}`}>
                        {competition.title}
                      </Link>
                      <p className="mt-1 text-xs text-text-tertiary">{competition.filtersSummary}</p>
                    </div>
                  </TD>
                  <TD>{competition.communityName}</TD>
                  <TD>
                    <div>
                      <p>{competition.startsAt}</p>
                      <p className="mt-1 text-xs text-text-tertiary">bitiş {competition.endsAt}</p>
                    </div>
                  </TD>
                  <TD>
                    {competition.entriesCount} entry / {competition.votesCount} oy
                  </TD>
                  <TD>
                    <div className="flex flex-wrap gap-xs">
                      <Badge tone={competition.suspicious ? "warning" : "default"}>
                        {competition.suspicious ? "şüpheli" : "normal"}
                      </Badge>
                      {competition.reportsCount > 0 ? <Badge tone="error">{competition.reportsCount} sinyal</Badge> : null}
                      {competition.blockedEntriesCount > 0 ? <Badge tone="warning">{competition.blockedEntriesCount} entry bloklu</Badge> : null}
                    </div>
                  </TD>
                  <TD>
                    <div className="flex flex-wrap gap-xs">
                      <Badge tone={status.tone}>{status.label}</Badge>
                      {competition.adminActionLabel ? <Badge tone="info">{competition.adminActionLabel}</Badge> : null}
                    </div>
                  </TD>
                </TR>
              );
            })
          ) : (
            <TR>
              <TD className="py-xl text-sm text-text-secondary" colSpan={6}>
                Gösterilecek yarışma bulunmuyor.
              </TD>
            </TR>
          )}
        </TBody>
      </Table>
    </TableWrapper>
  );
}
