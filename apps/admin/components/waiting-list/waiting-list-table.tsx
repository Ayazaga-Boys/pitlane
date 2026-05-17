import { Badge } from "@/components/ui/badge";
import { Table, TableWrapper, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import type { AdminWaitingListEntry } from "@/lib/admin-data";

function vehicleLabel(type: AdminWaitingListEntry["vehicleType"]) {
  switch (type) {
    case "car":
      return "otomobil";
    case "motorcycle":
      return "motosiklet";
    case "other":
      return "diğer";
    default:
      return "belirtilmedi";
  }
}

export function WaitingListTable({ entries }: { entries: AdminWaitingListEntry[] }) {
  return (
    <TableWrapper>
      <Table>
        <THead>
          <TR>
            <TH>E-posta</TH>
            <TH>Araç tipi</TH>
            <TH>Şehir</TH>
            <TH>Davet durumu</TH>
            <TH>Listeye giriş</TH>
          </TR>
        </THead>
        <TBody>
          {entries.map((entry) => (
            <TR key={entry.id}>
              <TD>
                <span className="font-medium text-text-primary">{entry.email}</span>
              </TD>
              <TD>{vehicleLabel(entry.vehicleType)}</TD>
              <TD>{entry.city ?? "Bilinmiyor"}</TD>
              <TD>
                <Badge tone={entry.invitedAt ? "success" : "warning"}>
                  {entry.invitedAt ? `davet edildi • ${entry.invitedAt}` : "bekliyor"}
                </Badge>
              </TD>
              <TD>{entry.createdAt}</TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </TableWrapper>
  );
}
