import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Table, TableWrapper, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import type { MockPin } from "@/lib/mock-data";

export function PinsTable({ pins }: { pins: MockPin[] }) {
  return (
    <TableWrapper>
      <Table>
        <THead>
          <TR>
            <TH>İşletme</TH>
            <TH>Kategori</TH>
            <TH>Sahip</TH>
            <TH>Konum</TH>
            <TH>Durum</TH>
            <TH>Başvuru</TH>
            <TH>Aksiyon</TH>
          </TR>
        </THead>
        <TBody>
          {pins.map((pin) => (
            <TR key={pin.id}>
              <TD>
                <Link className="focus-ring inline-flex rounded-xs font-medium text-text-primary hover:text-pit-red" href={`/pins/${pin.id}/verify`}>
                  {pin.name}
                </Link>
              </TD>
              <TD>
                {pin.category === "repair"
                  ? "tamir"
                  : pin.category === "fuel"
                    ? "yakıt"
                    : pin.category === "cafe"
                      ? "kafe"
                      : pin.category === "garage"
                        ? "garaj"
                        : pin.category === "parts"
                          ? "parça"
                          : "diğer"}
              </TD>
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
                  {pin.status === "verified" ? "doğrulandı" : pin.status === "rejected" ? "reddedildi" : "bekliyor"}
                </Badge>
              </TD>
              <TD>{pin.submittedAt}</TD>
              <TD>
                <Link className="focus-ring inline-flex rounded-xs text-sm font-medium text-pit-red hover:text-pit-red-soft" href={`/pins/${pin.id}/verify`}>
                  {pin.status === "pending" ? "İncele" : "Detayı aç"}
                </Link>
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </TableWrapper>
  );
}
