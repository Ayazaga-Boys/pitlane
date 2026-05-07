import { Badge } from "@/components/ui/badge";
import { Table, TableWrapper, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import type { MockReport } from "@/lib/mock-data";

export function ReportsTable({ reports }: { reports: MockReport[] }) {
  return (
    <TableWrapper>
      <Table>
        <THead>
          <TR>
            <TH>Icerik</TH>
            <TH>Neden</TH>
            <TH>Bildiren</TH>
            <TH>Oncelik</TH>
            <TH>Durum</TH>
            <TH>Zaman</TH>
          </TR>
        </THead>
        <TBody>
          {reports.map((report) => (
            <TR key={report.id}>
              <TD className="font-medium capitalize text-text-primary">{report.contentType.replace("_", " ")}</TD>
              <TD>{report.reason}</TD>
              <TD>@{report.reporter}</TD>
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
                  {report.severity}
                </Badge>
              </TD>
              <TD>
                <Badge tone={report.status === "pending" ? "warning" : "info"}>{report.status}</Badge>
              </TD>
              <TD>{report.createdAt}</TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </TableWrapper>
  );
}
