import Link from "next/link";
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
            <TH>Şehir</TH>
            <TH>Tür</TH>
            <TH>Araç tipi</TH>
            <TH>Üyeler</TH>
          </TR>
        </THead>
        <TBody>
          {communities.length > 0 ? (
            communities.map((community) => (
              <TR key={community.id}>
                <TD>
                  <div>
                    <Link
                      className="focus-ring rounded-sm font-medium text-text-primary hover:text-pit-red-soft"
                      href={`/communities/${community.id}`}
                    >
                      {community.name}
                    </Link>
                    <p className="mt-1 text-xs text-text-tertiary">/{community.slug}</p>
                  </div>
                </TD>
                <TD>{community.city}</TD>
                <TD>
                  <Badge tone={community.type === "public" ? "success" : community.type === "private" ? "warning" : "error"}>
                    {community.type === "public" ? "açık" : community.type === "private" ? "özel" : "gizli"}
                  </Badge>
                </TD>
                <TD>
                  {community.vehicleType === "car"
                    ? "otomobil"
                    : community.vehicleType === "motorcycle"
                      ? "motosiklet"
                      : "tümü"}
                </TD>
                <TD>{community.members}</TD>
              </TR>
            ))
          ) : (
            <TR>
              <TD className="py-xl text-sm text-text-secondary" colSpan={5}>
                Henüz gerçek topluluk kaydı bulunmuyor.
              </TD>
            </TR>
          )}
        </TBody>
      </Table>
    </TableWrapper>
  );
}
