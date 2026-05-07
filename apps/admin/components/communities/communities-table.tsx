import { Badge } from "@/components/ui/badge";
import { Table, TableWrapper, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import type { MockCommunity } from "@/lib/mock-data";

export function CommunitiesTable({ communities }: { communities: MockCommunity[] }) {
  return (
    <TableWrapper>
      <Table>
        <THead>
          <TR>
            <TH>Topluluk</TH>
            <TH>Sehir</TH>
            <TH>Tur</TH>
            <TH>Arac tipi</TH>
            <TH>Uyeler</TH>
          </TR>
        </THead>
        <TBody>
          {communities.map((community) => (
            <TR key={community.id}>
              <TD>
                <div>
                  <p className="font-medium text-text-primary">{community.name}</p>
                  <p className="mt-1 text-xs text-text-tertiary">/{community.slug}</p>
                </div>
              </TD>
              <TD>{community.city}</TD>
              <TD>
                <Badge tone={community.type === "public" ? "success" : community.type === "private" ? "warning" : "error"}>
                  {community.type}
                </Badge>
              </TD>
              <TD>{community.vehicleType}</TD>
              <TD>{community.members}</TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </TableWrapper>
  );
}
