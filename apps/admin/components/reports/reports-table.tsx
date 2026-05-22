import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Table, TableWrapper, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import type { MockReport } from "@/lib/mock-data";

export function ReportsTable({ reports }: { reports: MockReport[] }) {
  return (
    <TableWrapper>
      <Table>
        <THead>
          <TR>
            <TH>İçerik</TH>
            <TH>Neden</TH>
            <TH>Bildiren</TH>
            <TH>Öncelik</TH>
            <TH>Durum</TH>
            <TH>Zaman</TH>
          </TR>
        </THead>
        <TBody>
          {reports.length > 0 ? (
            reports.map((report) => (
              <TR key={report.id}>
                <TD className="font-medium capitalize text-text-primary">
                  <Link className="focus-ring inline-flex rounded-xs hover:text-pit-red" href={`/reports/${report.id}`}>
                    {report.contentType === "message"
                      ? "mesaj"
                      : report.contentType === "flare"
                        ? "flare"
                        : report.contentType === "post"
                          ? "post"
                          : report.contentType === "comment"
                            ? "yorum"
                        : "topluluk gönderisi"}
                  </Link>
                </TD>
                <TD>{report.reason}</TD>
                <TD>{report.reporter}</TD>
                <TD>
                  <Badge
                    tone={
                      report.severity === "high"
                        ? "error"
                        : report.severity === "medium"
                          ? "warning"
                          : "info"
                    }
                  >
                    {report.severity === "high" ? "yüksek" : report.severity === "medium" ? "orta" : "düşük"}
                  </Badge>
                </TD>
                <TD>
                  <Badge tone={report.status === "pending" ? "warning" : "info"}>
                    {report.status === "pending" ? "bekliyor" : "inceleniyor"}
                  </Badge>
                </TD>
                <TD>{report.createdAt}</TD>
              </TR>
            ))
          ) : (
            <TR>
              <TD className="py-xl text-sm text-text-secondary" colSpan={6}>
                Bekleyen gerçek şikayet kaydı bulunmuyor.
              </TD>
            </TR>
          )}
        </TBody>
      </Table>
    </TableWrapper>
  );
}
