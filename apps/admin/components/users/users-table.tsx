import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Table, TableWrapper, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import type { MockUser } from "@/lib/mock-data";

export function UsersTable({ users }: { users: MockUser[] }) {
  return (
    <TableWrapper>
      <Table>
        <THead>
          <TR>
            <TH>Kullanıcı</TH>
            <TH>Rol</TH>
            <TH>Şehir</TH>
            <TH>Şikayet</TH>
            <TH>Durum</TH>
            <TH>Kayıt</TH>
          </TR>
        </THead>
        <TBody>
          {users.map((user) => (
            <TR key={user.id}>
              <TD>
                <div>
                  <Link
                    className="focus-ring inline-flex rounded-xs text-left font-medium text-text-primary hover:text-pit-red"
                    href={`/users/${user.id}`}
                  >
                    {user.displayName}
                  </Link>
                  <p className="mt-1 text-xs text-text-tertiary">@{user.username}</p>
                </div>
              </TD>
              <TD>
                <Badge tone={user.role === "admin" ? "error" : user.role === "moderator" ? "info" : "default"}>
                  {user.role === "admin" ? "admin" : user.role === "moderator" ? "moderatör" : "kullanıcı"}
                </Badge>
              </TD>
              <TD>{user.city}</TD>
              <TD>{user.reports}</TD>
              <TD>
                <Badge tone={user.status === "active" ? "success" : "warning"}>
                  {user.status === "active" ? "aktif" : "askıda"}
                </Badge>
              </TD>
              <TD>{user.createdAt}</TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </TableWrapper>
  );
}
