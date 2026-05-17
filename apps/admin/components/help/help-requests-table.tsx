import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Table, TableWrapper, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import type { AdminHelpRequest } from "@/lib/admin-data";

function issueTypeLabel(issueType: AdminHelpRequest["issueType"]) {
  switch (issueType) {
    case "breakdown":
      return "Arıza";
    case "flat_tire":
      return "Lastik";
    case "fuel":
      return "Yakıt";
    case "accident":
      return "Kaza";
    default:
      return "Diğer";
  }
}

function statusTone(status: AdminHelpRequest["status"]) {
  switch (status) {
    case "open":
      return "warning";
    case "matched":
      return "info";
    case "resolved":
      return "success";
    default:
      return "default";
  }
}

function statusLabel(status: AdminHelpRequest["status"]) {
  switch (status) {
    case "open":
      return "açık";
    case "matched":
      return "eşleşti";
    case "resolved":
      return "çözüldü";
    default:
      return "iptal";
  }
}

export function HelpRequestsTable({ requests }: { requests: AdminHelpRequest[] }) {
  return (
    <TableWrapper>
      <Table>
        <THead>
          <TR>
            <TH>Talep eden</TH>
            <TH>Tür</TH>
            <TH>Durum</TH>
            <TH>Not</TH>
            <TH>Zaman</TH>
          </TR>
        </THead>
        <TBody>
          {requests.map((request) => (
            <TR key={request.id}>
              <TD>
                <div>
                  <Link
                    className="focus-ring inline-flex rounded-xs text-left font-medium text-text-primary hover:text-pit-red"
                    href={`/help-requests/${request.id}`}
                  >
                    {request.requesterLabel}
                  </Link>
                  <p className="mt-1 text-xs text-text-tertiary">{request.city}</p>
                </div>
              </TD>
              <TD>
                <Badge tone="default">{issueTypeLabel(request.issueType)}</Badge>
              </TD>
              <TD>
                <Badge tone={statusTone(request.status)}>{statusLabel(request.status)}</Badge>
              </TD>
              <TD>{request.note}</TD>
              <TD>{request.createdAt}</TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </TableWrapper>
  );
}
