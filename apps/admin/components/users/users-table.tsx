import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Table, TableWrapper, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import type { MockUser } from "@/lib/mock-data";

function getInitials(user: MockUser) {
  return user.displayName
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function UsersTable({ users }: { users: MockUser[] }) {
  return (
    <TableWrapper>
      <Table>
        <THead>
          <TR>
            <TH>Kullanıcı</TH>
            <TH>Rol</TH>
            <TH>Profil</TH>
            <TH>Şehir</TH>
            <TH>Takip</TH>
            <TH>Şikayet</TH>
            <TH>Durum</TH>
            <TH>Kayıt</TH>
          </TR>
        </THead>
        <TBody>
          {users.map((user) => (
            <TR key={user.id}>
              <TD>
                <div className="flex items-center gap-md">
                  {user.avatarUrl ? (
                    <img
                      alt={`${user.displayName} avatar`}
                      className="size-10 rounded-full border border-surface-3 object-cover"
                      height={40}
                      src={user.avatarUrl}
                      width={40}
                    />
                  ) : (
                    <div className="flex size-10 items-center justify-center rounded-full border border-surface-3 bg-surface-2 text-xs font-semibold text-text-secondary">
                      {getInitials(user)}
                    </div>
                  )}
                  <div>
                    <Link
                      className="focus-ring inline-flex rounded-xs text-left font-medium text-text-primary hover:text-pit-red"
                      href={`/users/${user.id}`}
                    >
                      {user.displayName}
                    </Link>
                    <p className="mt-1 text-xs text-text-tertiary">@{user.username}</p>
                    <div className="mt-2 flex flex-wrap gap-xs">
                      <Badge tone={user.isPrivate ? "warning" : "success"}>{user.isPrivate ? "private" : "public"}</Badge>
                      <Badge tone={user.avatarUrl ? "info" : "default"}>{user.avatarUrl ? "avatar var" : "avatar yok"}</Badge>
                    </div>
                  </div>
                </div>
              </TD>
              <TD>
                <Badge tone={user.role === "admin" ? "error" : user.role === "moderator" ? "info" : "default"}>
                  {user.role === "admin" ? "admin" : user.role === "moderator" ? "moderatör" : "kullanıcı"}
                </Badge>
              </TD>
              <TD>{user.locationShareMode === "everyone" ? "herkese açık" : user.locationShareMode === "followers" ? "takipçiler" : "kapalı"}</TD>
              <TD>{user.city}</TD>
              <TD>{user.followersCount} / {user.followingCount}</TD>
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
