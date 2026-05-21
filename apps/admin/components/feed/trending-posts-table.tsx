import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableWrapper, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import type { AdminTrendingPost } from "@/lib/admin-data";
import { applyBoostOverride, applyShadowbanOverride, clearFeedOverride } from "@/app/(dashboard)/feed-overrides/actions";

function mapVisibilityLabel(visibility: AdminTrendingPost["visibility"]) {
  if (visibility === "followers") return "takipçiler";
  if (visibility === "private") return "private";
  return "public";
}

export function TrendingPostsTable({
  posts,
  overridesDisabled,
}: {
  posts: AdminTrendingPost[];
  overridesDisabled: boolean;
}) {
  return (
    <TableWrapper>
      <Table>
        <THead>
          <TR>
            <TH>Trend post</TH>
            <TH>Skor</TH>
            <TH>Engagement</TH>
            <TH>Etkileşim</TH>
            <TH>Override</TH>
            <TH>Aksiyon</TH>
          </TR>
        </THead>
        <TBody>
          {posts.length > 0 ? (
            posts.map((post) => (
              <TR key={post.postId}>
                <TD>
                  <div className="flex gap-md">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md border border-surface-3 bg-surface-1">
                      {post.mediaPreviewUrl ? (
                        <img alt={`${post.authorName} post preview`} className="h-full w-full object-cover" src={post.mediaPreviewUrl} />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[11px] text-text-tertiary">preview yok</div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Link className="focus-ring inline-flex rounded-xs font-medium text-text-primary hover:text-pit-red" href={`/posts/${post.postId}`}>
                        {post.caption}
                      </Link>
                      <p className="text-xs text-text-tertiary">
                        {post.authorName} · @{post.authorUsername} · {mapVisibilityLabel(post.visibility)}
                      </p>
                    </div>
                  </div>
                </TD>
                <TD>
                  <span className="font-semibold text-text-primary">{post.score.toFixed(3)}</span>
                </TD>
                <TD>{post.engagementRate.toFixed(3)}</TD>
                <TD>
                  {post.likeCount} beğeni / {post.commentCount} yorum
                </TD>
                <TD>
                  <Badge tone={post.overrideState === "boost" ? "success" : post.overrideState === "shadowban" ? "error" : "default"}>
                    {post.overrideState === "boost" ? "feature" : post.overrideState === "shadowban" ? "shadowban" : "yok"}
                  </Badge>
                </TD>
                <TD>
                  <div className="flex min-w-[240px] flex-wrap gap-sm">
                    <form action={applyBoostOverride}>
                      <input name="post_id" type="hidden" value={post.postId} />
                      <Button disabled={overridesDisabled} type="submit" variant="secondary">
                        Feature
                      </Button>
                    </form>
                    <form action={applyShadowbanOverride}>
                      <input name="post_id" type="hidden" value={post.postId} />
                      <Button disabled={overridesDisabled} type="submit" variant="ghost">
                        Shadowban
                      </Button>
                    </form>
                    <form action={clearFeedOverride}>
                      <input name="post_id" type="hidden" value={post.postId} />
                      <Button disabled={overridesDisabled || post.overrideState === "none"} type="submit" variant="destructive">
                        Temizle
                      </Button>
                    </form>
                  </div>
                </TD>
              </TR>
            ))
          ) : (
            <TR>
              <TD className="py-xl text-sm text-text-secondary" colSpan={6}>
                Trend hesabına düşen post bulunmuyor.
              </TD>
            </TR>
          )}
        </TBody>
      </Table>
    </TableWrapper>
  );
}
