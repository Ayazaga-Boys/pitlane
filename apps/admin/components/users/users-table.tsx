import { Badge } from "@/components/ui/badge";
import { Table, TableWrapper, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import type { MockUser } from "@/lib/mock-data";

export function UsersTable({ users }: { users: MockUser[] }) {
  return (
    <TableWrapper>
      <Table>
        <THead>
          <TR>
            <TH>Kullanici</TH>
            <TH>Rol</TH>
            <TH>Sehir</TH>
            <TH>Sikayet</TH>
            <TH>Durum</TH>
            <TH>Kayit</TH>
          </TR>
        </THead>
        <TBody>
          {users.map((user) => (
            <TR key={user.id}>
              <TD>
                <div>
                  <p className="font-medium text-text-primary">{user.displayName}</p>
                  <p className="mt-1 text-xs text-text-tertiary">@{user.username}</p>
                </div>
              </TD>
              <TD>
                <Badge tone={user.role === "admin" ? "error" : user.role === "moderator" ? "info" : "default"}>
                  {user.role}
                </Badge>
              </TD>
              <TD>{user.city}</TD>
              <TD>{user.reports}</TD>
              <TD>
                <Badge tone={user.status === "active" ? "success" : "warning"}>{user.status}</Badge>
              </TD>
              <TD>{user.createdAt}</TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </TableWrapper>
  );
}
