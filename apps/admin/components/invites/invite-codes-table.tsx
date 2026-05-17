import { Badge } from "@/components/ui/badge";
import { Table, TableWrapper, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import type { AdminInviteCode } from "@/lib/admin-data";

export function InviteCodesTable({ codes }: { codes: AdminInviteCode[] }) {
  return (
    <TableWrapper>
      <Table>
        <THead>
          <TR>
            <TH>Kod</TH>
            <TH>Oluşturan</TH>
            <TH>Kullanım</TH>
            <TH>Bitiş</TH>
            <TH>Oluşturulma</TH>
          </TR>
        </THead>
        <TBody>
          {codes.map((code) => (
            <TR key={code.code}>
              <TD>
                <span className="font-mono text-sm text-text-primary">{code.code}</span>
              </TD>
              <TD>{code.inviterLabel}</TD>
              <TD>
                <Badge tone={code.usesCount >= code.maxUses ? "warning" : code.usesCount > 0 ? "info" : "success"}>
                  {code.usesCount} / {code.maxUses}
                </Badge>
              </TD>
              <TD>{code.expiresAt ?? "Süresiz"}</TD>
              <TD>{code.createdAt}</TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </TableWrapper>
  );
}
