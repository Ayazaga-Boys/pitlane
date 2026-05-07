import { Badge } from "@/components/ui/badge";
import { Table, TableWrapper, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import type { MockPin } from "@/lib/mock-data";

export function PinsTable({ pins }: { pins: MockPin[] }) {
  return (
    <TableWrapper>
      <Table>
        <THead>
          <TR>
            <TH>Isletme</TH>
            <TH>Kategori</TH>
            <TH>Sahip</TH>
            <TH>Sehir</TH>
            <TH>Durum</TH>
            <TH>Basvuru</TH>
          </TR>
        </THead>
        <TBody>
          {pins.map((pin) => (
            <TR key={pin.id}>
              <TD className="font-medium text-text-primary">{pin.name}</TD>
              <TD>{pin.category}</TD>
              <TD>{pin.owner}</TD>
              <TD>{pin.city}</TD>
              <TD>
                <Badge
                  tone={
                    pin.status === "verified"
                      ? "success"
                      : pin.status === "rejected"
                        ? "error"
                        : "warning"
                  }
                >
                  {pin.status}
                </Badge>
              </TD>
              <TD>{pin.submittedAt}</TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </TableWrapper>
  );
}
