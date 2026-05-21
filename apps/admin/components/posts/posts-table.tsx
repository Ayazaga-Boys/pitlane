import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Table, TableWrapper, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import type { AdminModerationPost } from "@/lib/admin-data";

function mapVisibilityLabel(visibility: AdminModerationPost["visibility"]) {
  if (visibility === "followers") return "takipçiler";
  if (visibility === "private") return "private";
  return "public";
}

export function PostsTable({ posts }: { posts: AdminModerationPost[] }) {
  return (
    <TableWrapper>
      <Table>
        <THead>
          <TR>
            <TH>Gönderi</TH>
            <TH>Yazar</TH>
            <TH>Görünürlük</TH>
            <TH>Rapor</TH>
            <TH>Yorum</TH>
            <TH>Durum</TH>
            <TH>Zaman</TH>
          </TR>
        </THead>
        <TBody>
          {posts.length > 0 ? (
            posts.map((post) => (
              <TR key={post.id}>
                <TD>
                  <div className="space-y-2">
                    <Link className="focus-ring inline-flex rounded-xs font-medium text-text-primary hover:text-pit-red" href={`/posts/${post.id}`}>
                      {post.caption}
                    </Link>
                    <div className="flex flex-wrap gap-xs">
                      <Badge tone={post.mediaKind === "video" ? "info" : post.mediaKind === "image" ? "success" : "default"}>
                        {post.mediaKind === "video" ? "video" : post.mediaKind === "image" ? "görsel" : "medya yok"}
                      </Badge>
                      {post.latestReportReason ? <Badge tone="warning">{post.latestReportReason}</Badge> : null}
                    </div>
                  </div>
                </TD>
                <TD>
                  <div>
                    <p className="font-medium text-text-primary">{post.authorName}</p>
                    <p className="mt-1 text-xs text-text-tertiary">@{post.authorUsername}</p>
                  </div>
                </TD>
                <TD>{mapVisibilityLabel(post.visibility)}</TD>
                <TD>{post.reportsCount}</TD>
                <TD>{post.commentsCount}</TD>
                <TD>
                  <Badge tone={post.deletedAt ? "error" : post.reportsCount > 0 ? "warning" : "success"}>
                    {post.deletedAt ? "kaldırıldı" : post.reportsCount > 0 ? "incelemede" : "temiz"}
                  </Badge>
                </TD>
                <TD>{post.createdAt}</TD>
              </TR>
            ))
          ) : (
            <TR>
              <TD className="py-xl text-sm text-text-secondary" colSpan={7}>
                İncelenecek gönderi bulunmuyor.
              </TD>
            </TR>
          )}
        </TBody>
      </Table>
    </TableWrapper>
  );
}
