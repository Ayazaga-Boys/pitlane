import { Badge } from "@/components/ui/badge";
import { Table, TableWrapper, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import type { AdminBusinessLocation } from "@/lib/admin-data";

export function BusinessLocationsTable({ locations }: { locations: AdminBusinessLocation[] }) {
  return (
    <TableWrapper>
      <Table>
        <THead>
          <TR>
            <TH>İşletme</TH>
            <TH>Sahip</TH>
            <TH>Konum</TH>
            <TH>Featured</TH>
            <TH>Durum</TH>
          </TR>
        </THead>
        <TBody>
          {locations.length > 0 ? (
            locations.map((location) => (
              <TR key={location.id}>
                <TD>
                  <div>
                    <p className="font-medium text-text-primary">{location.businessName}</p>
                    <p className="mt-1 text-xs text-text-tertiary">{location.address}</p>
                  </div>
                </TD>
                <TD>{location.ownerName}</TD>
                <TD>
                  {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
                </TD>
                <TD>
                  <Badge tone={location.featuredRank <= 3 ? "success" : location.featuredRank <= 10 ? "info" : "default"}>#{location.featuredRank}</Badge>
                </TD>
                <TD>
                  <Badge tone={location.isActive ? "success" : "error"}>{location.isActive ? "aktif" : "pasif"}</Badge>
                </TD>
              </TR>
            ))
          ) : (
            <TR>
              <TD className="py-xl text-sm text-text-secondary" colSpan={5}>
                Gösterilecek business location bulunmuyor.
              </TD>
            </TR>
          )}
        </TBody>
      </Table>
    </TableWrapper>
  );
}
