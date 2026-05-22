import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableWrapper, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import type { AdminCommunityInvite } from "@/lib/admin-data";
import { revokeCommunityInvite } from "@/app/(dashboard)/invites/actions";

function mapStatus(status: AdminCommunityInvite["status"]) {
  if (status === "expired") return { label: "expired", tone: "warning" as const };
  if (status === "revoked") return { label: "revoked", tone: "error" as const };
  return { label: "active", tone: "success" as const };
}

export function CommunityInvitesTable({
  invites,
  actionsDisabled,
}: {
  invites: AdminCommunityInvite[];
  actionsDisabled: boolean;
}) {
  return (
    <TableWrapper>
      <Table>
        <THead>
          <TR>
            <TH>Topluluk</TH>
            <TH>Token</TH>
            <TH>Kullanım</TH>
            <TH>Sinyal</TH>
            <TH>Bitiş</TH>
            <TH>Aksiyon</TH>
          </TR>
        </THead>
        <TBody>
          {invites.length > 0 ? (
            invites.map((invite) => {
              const status = mapStatus(invite.status);
              return (
                <TR key={invite.id}>
                  <TD>
                    <div>
                      <p className="font-medium text-text-primary">{invite.communityName}</p>
                      <p className="mt-1 text-xs text-text-tertiary">{invite.creatorName}</p>
                    </div>
                  </TD>
                  <TD>
                    <div className="space-y-2">
                      <span className="font-mono text-sm text-text-primary">{invite.token}</span>
                      <div className="flex flex-wrap gap-xs">
                        <Badge tone="default">{invite.tokenType}</Badge>
                        <Badge tone={invite.mode === "request" ? "warning" : "info"}>{invite.mode}</Badge>
                        <Badge tone={status.tone}>{status.label}</Badge>
                      </div>
                    </div>
                  </TD>
                  <TD>
                    <div className="space-y-2">
                      <Badge tone={invite.maxUses !== null && invite.usesCount >= invite.maxUses ? "warning" : "success"}>
                        {invite.usesCount} / {invite.maxUses ?? "sinirsiz"}
                      </Badge>
                      <p className="text-xs text-text-tertiary">
                        {invite.pendingJoinRequests} request · {invite.pendingDirectInvites} direct
                      </p>
                    </div>
                  </TD>
                  <TD>
                    <Badge tone={invite.suspicious ? "error" : "default"}>
                      {invite.suspicious ? "suspicious" : "normal"}
                    </Badge>
                  </TD>
                  <TD>
                    <div>
                      <p>{invite.expiresAt ?? "Süresiz"}</p>
                      <p className="mt-1 text-xs text-text-tertiary">{invite.createdAt}</p>
                    </div>
                  </TD>
                  <TD>
                    <form action={revokeCommunityInvite}>
                      <input name="inviteId" type="hidden" value={invite.id} />
                      <Button disabled={actionsDisabled || invite.status !== "active"} type="submit" variant="destructive">
                        Revoke
                      </Button>
                    </form>
                  </TD>
                </TR>
              );
            })
          ) : (
            <TR>
              <TD className="py-xl text-sm text-text-secondary" colSpan={6}>
                Yönetilecek community invite bulunmuyor.
              </TD>
            </TR>
          )}
        </TBody>
      </Table>
    </TableWrapper>
  );
}
