import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Table, TableWrapper, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import type { AdminBusinessApplication } from "@/lib/admin-data";

function mapCategory(category: AdminBusinessApplication["category"]) {
  switch (category) {
    case "garage":
      return "garaj";
    case "repair":
      return "tamir";
    case "parts":
      return "parça";
    case "fuel":
      return "yakıt";
    case "cafe":
      return "kafe";
    case "dealer":
      return "galeri";
    default:
      return "diğer";
  }
}

function mapStatus(status: AdminBusinessApplication["status"]) {
  if (status === "approved") return { label: "onaylandı", tone: "success" as const };
  if (status === "rejected") return { label: "reddedildi", tone: "error" as const };
  if (status === "under_review") return { label: "incelemede", tone: "info" as const };
  return { label: "bekliyor", tone: "warning" as const };
}

export function BusinessApplicationsTable({ applications }: { applications: AdminBusinessApplication[] }) {
  return (
    <TableWrapper>
      <Table>
        <THead>
          <TR>
            <TH>İşletme</TH>
            <TH>Başvuran</TH>
            <TH>Kategori</TH>
            <TH>Belge</TH>
            <TH>Durum</TH>
            <TH>Zaman</TH>
          </TR>
        </THead>
        <TBody>
          {applications.length > 0 ? (
            applications.map((application) => {
              const status = mapStatus(application.status);
              return (
                <TR key={application.id}>
                  <TD>
                    <div className="space-y-2">
                      <Link
                        className="focus-ring inline-flex rounded-xs font-medium text-text-primary hover:text-pit-red"
                        href={`/business/applications/${application.id}`}
                      >
                        {application.businessName}
                      </Link>
                      <p className="text-xs text-text-tertiary">{application.address}</p>
                    </div>
                  </TD>
                  <TD>
                    <div>
                      <p className="font-medium text-text-primary">{application.applicantName}</p>
                      <p className="mt-1 text-xs text-text-tertiary">@{application.applicantUsername}</p>
                    </div>
                  </TD>
                  <TD>{mapCategory(application.category)}</TD>
                  <TD>
                    <div className="flex flex-wrap gap-xs">
                      <Badge tone={application.hasUploadedDocuments ? "success" : "warning"}>
                        {application.documentsCount} belge
                      </Badge>
                    </div>
                  </TD>
                  <TD>
                    <Badge tone={status.tone}>{status.label}</Badge>
                  </TD>
                  <TD>
                    <div>
                      <p>{application.createdAt}</p>
                      {application.reviewedAt ? <p className="mt-1 text-xs text-text-tertiary">inceleme: {application.reviewedAt}</p> : null}
                    </div>
                  </TD>
                </TR>
              );
            })
          ) : (
            <TR>
              <TD className="py-xl text-sm text-text-secondary" colSpan={6}>
                Gösterilecek işletme başvurusu bulunmuyor.
              </TD>
            </TR>
          )}
        </TBody>
      </Table>
    </TableWrapper>
  );
}
