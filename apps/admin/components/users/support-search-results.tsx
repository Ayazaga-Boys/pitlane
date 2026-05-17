import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Table, TableWrapper, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import type { AdminSupportSearchUser } from "@/lib/admin-data";

function roleLabel(role: AdminSupportSearchUser["role"]) {
  switch (role) {
    case "admin":
      return "admin";
    case "moderator":
      return "moderatör";
    case "banned":
      return "banlı";
    default:
      return "kullanıcı";
  }
}

export function SupportSearchResults({ users }: { users: AdminSupportSearchUser[] }) {
  return (
    <TableWrapper>
      <Table>
        <THead>
          <TR>
            <TH>Kullanıcı</TH>
            <TH>E-posta</TH>
            <TH>Telefon</TH>
            <TH>Rol</TH>
            <TH>Durum</TH>
            <TH>Kayıt</TH>
          </TR>
        </THead>
        <TBody>
          {users.map((user) => (
            <TR key={user.id}>
              <TD>
                <div>
                  <Link className="focus-ring inline-flex rounded-xs font-medium text-text-primary hover:text-pit-red" href={`/users/${user.id}`}>
                    {user.displayName}
                  </Link>
                  <p className="mt-1 text-xs text-text-tertiary">@{user.username}</p>
                </div>
              </TD>
              <TD>{user.email}</TD>
              <TD>{user.phone ?? "Telefon yok"}</TD>
              <TD>
                <Badge tone={user.role === "admin" ? "error" : user.role === "moderator" ? "info" : user.role === "banned" ? "warning" : "default"}>
                  {roleLabel(user.role)}
                </Badge>
              </TD>
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
