import { Button } from "@/components/ui/button";
import { Table, TableWrapper, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import type { AdminBusinessLocation } from "@/lib/admin-data";
import { updateBusinessFeaturedRank } from "@/app/(dashboard)/business/featured/actions";

export function FeaturedBusinessesTable({
  locations,
  actionsDisabled,
}: {
  locations: AdminBusinessLocation[];
  actionsDisabled: boolean;
}) {
  return (
    <TableWrapper>
      <Table>
        <THead>
          <TR>
            <TH>İşletme</TH>
            <TH>Adres</TH>
            <TH>Mevcut sıra</TH>
            <TH>Yeni sıra</TH>
          </TR>
        </THead>
        <TBody>
          {locations.length > 0 ? (
            locations.map((location) => (
              <TR key={location.id}>
                <TD>
                  <div>
                    <p className="font-medium text-text-primary">{location.businessName}</p>
                    <p className="mt-1 text-xs text-text-tertiary">{location.ownerName}</p>
                  </div>
                </TD>
                <TD>{location.address}</TD>
                <TD>#{location.featuredRank}</TD>
                <TD>
                  <form action={updateBusinessFeaturedRank} className="flex items-center gap-sm">
                    <input name="locationId" type="hidden" value={location.id} />
                    <input
                      className="focus-ring min-h-11 w-24 rounded-sm border border-surface-3 bg-surface-1 px-md py-sm text-sm text-text-primary"
                      defaultValue={location.featuredRank}
                      min={0}
                      name="featuredRank"
                      type="number"
                    />
                    <Button disabled={actionsDisabled} type="submit" variant="secondary">
                      Güncelle
                    </Button>
                  </form>
                </TD>
              </TR>
            ))
          ) : (
            <TR>
              <TD className="py-xl text-sm text-text-secondary" colSpan={4}>
                Sıralanacak business location bulunmuyor.
              </TD>
            </TR>
          )}
        </TBody>
      </Table>
    </TableWrapper>
  );
}
