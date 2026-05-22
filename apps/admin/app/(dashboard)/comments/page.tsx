import Link from "next/link";
import { DataStateBanner } from "@/components/dashboard/data-state-banner";
import { PageShell } from "@/components/dashboard/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableWrapper, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { getAdminCommentsOrMock } from "@/lib/admin-data";
import { getAdminIdentity } from "@/lib/auth";
import { mockModerationComments } from "@/lib/mock-data";
import { banCommentAuthor, deleteCommentContent, restoreCommentContent, suspendCommentAuthor, warnCommentAuthor } from "./actions";

export default async function CommentsPage({
  searchParams,
}: {
  searchParams?: { result?: string; q?: string; state?: string; reports?: string };
}) {
  const identity = await getAdminIdentity();
  const { data: comments, usingMockData } = await getAdminCommentsOrMock(mockModerationComments);
  const isModerator = identity.role === "moderator";
  const query = searchParams?.q?.trim().toLocaleLowerCase("tr-TR") ?? "";
  const state = searchParams?.state?.trim() ?? "";
  const reports = searchParams?.reports?.trim() ?? "";
  const filteredComments = comments.filter((comment) => {
    const matchesQuery =
      !query ||
      [comment.body, comment.authorName, comment.authorUsername, comment.postCaption]
        .join(" ")
        .toLocaleLowerCase("tr-TR")
        .includes(query);
    const matchesState =
      !state || (state === "deleted" ? comment.isDeleted : state === "active" ? !comment.isDeleted : true);
    const matchesReports =
      !reports || (reports === "reported" ? comment.reportsCount > 0 : reports === "clean" ? comment.reportsCount === 0 : true);

    return matchesQuery && matchesState && matchesReports;
  });

  return (
    <PageShell
      eyebrow="V2.2 moderasyon"
      title="Yorum Moderasyonu"
      description="Raporlanan yorumları öne çıkarır; hızlı kaldırma ve kullanıcı aksiyonlarını tek tablodan uygular."
    >
      {searchParams?.result ? (
        <div className="rounded-md border border-success/30 bg-success/10 p-md text-sm leading-6 text-text-primary">
          {searchParams.result === "content_deleted"
            ? "Yorum kaldırıldı."
            : searchParams.result === "content_restored"
              ? "Yorum yeniden yayına alındı."
            : searchParams.result === "warned"
              ? "Yorum sahibine uyarı gönderildi."
              : searchParams.result === "suspended"
                ? "Yorum sahibi 7 gün askıya alındı."
                : "Yorum sahibi kalıcı olarak banlandı."}
        </div>
      ) : null}

      <DataStateBanner
        usingMockData={usingMockData}
        mockLabel="Comment report kontratı tamamlanana kadar örnek yorum kuyruğu gösteriliyor."
        liveLabel="Gerçek yorum kuyruğu aktif. Aksiyonlar doğrudan comments/profiles üstünde çalışır."
      />

      <div className="surface-panel p-xl">
        <form className="mb-lg grid gap-md md:grid-cols-4" method="get">
          <label className="space-y-sm md:col-span-2">
            <span className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Arama</span>
            <Input defaultValue={searchParams?.q ?? ""} name="q" placeholder="Yorum, kullanıcı veya post ara" />
          </label>
          <label className="space-y-sm">
            <span className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Durum</span>
            <select
              className="focus-ring min-h-12 w-full rounded-sm border border-surface-3 bg-surface-1 px-md py-md text-sm text-text-primary"
              defaultValue={state}
              name="state"
            >
              <option value="">Tümü</option>
              <option value="active">Aktif</option>
              <option value="deleted">Kaldırılmış</option>
            </select>
          </label>
          <label className="space-y-sm">
            <span className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Rapor</span>
            <select
              className="focus-ring min-h-12 w-full rounded-sm border border-surface-3 bg-surface-1 px-md py-md text-sm text-text-primary"
              defaultValue={reports}
              name="reports"
            >
              <option value="">Tümü</option>
              <option value="reported">Raporlu</option>
              <option value="clean">Temiz</option>
            </select>
          </label>
          <div className="flex gap-sm md:col-span-4">
            <Button type="submit">Filtrele</Button>
            <a className="focus-ring inline-flex min-h-11 items-center justify-center rounded-sm bg-surface-3 px-lg py-md text-sm font-semibold text-text-primary" href="/comments">
              Temizle
            </a>
          </div>
        </form>
        <TableWrapper>
          <Table>
            <THead>
              <TR>
                <TH>Yorum</TH>
                <TH>Post</TH>
                <TH>Yazar</TH>
                <TH>Rapor</TH>
                <TH>Durum</TH>
                <TH>Zaman</TH>
                <TH>Aksiyon</TH>
              </TR>
            </THead>
            <TBody>
              {filteredComments.length > 0 ? (
                filteredComments.map((comment) => {
                  const deleteAction = deleteCommentContent.bind(null, comment.id);
                  const restoreAction = restoreCommentContent.bind(null, comment.id);
                  const warnAction = warnCommentAuthor.bind(null, comment.id);
                  const suspendAction = suspendCommentAuthor.bind(null, comment.id);
                  const banAction = banCommentAuthor.bind(null, comment.id);

                  return (
                    <TR key={comment.id}>
                      <TD>
                        <div className="space-y-2">
                          <p className="font-medium text-text-primary">{comment.body}</p>
                          {comment.latestReportReason ? <Badge tone="warning">{comment.latestReportReason}</Badge> : null}
                        </div>
                      </TD>
                      <TD>
                        <Link className="focus-ring inline-flex rounded-xs text-text-primary hover:text-pit-red" href={`/posts/${comment.postId}`}>
                          {comment.postCaption}
                        </Link>
                      </TD>
                      <TD>
                        <div>
                          <p className="font-medium text-text-primary">{comment.authorName}</p>
                          <p className="mt-1 text-xs text-text-tertiary">@{comment.authorUsername}</p>
                        </div>
                      </TD>
                      <TD>{comment.reportsCount}</TD>
                      <TD>
                        <Badge tone={comment.isDeleted ? "error" : comment.reportsCount > 0 ? "warning" : "success"}>
                          {comment.isDeleted ? "kaldırıldı" : comment.reportsCount > 0 ? "incelemede" : "temiz"}
                        </Badge>
                      </TD>
                      <TD>{comment.createdAt}</TD>
                      <TD>
                        <div className="flex flex-wrap gap-sm">
                          <form action={deleteAction}>
                            <Button disabled={usingMockData || comment.isDeleted} type="submit" variant="secondary">
                              Kaldır
                            </Button>
                          </form>
                          <form action={restoreAction}>
                            <Button disabled={usingMockData || !comment.isDeleted} type="submit" variant="ghost">
                              Geri yükle
                            </Button>
                          </form>
                          <form action={warnAction}>
                            <Button disabled={usingMockData} type="submit">
                              Uyar
                            </Button>
                          </form>
                          <form action={suspendAction}>
                            <Button disabled={usingMockData || isModerator} type="submit" variant="secondary">
                              Suspend
                            </Button>
                          </form>
                          <form action={banAction}>
                            <Button disabled={usingMockData || isModerator} type="submit" variant="destructive">
                              Ban
                            </Button>
                          </form>
                        </div>
                      </TD>
                    </TR>
                  );
                })
              ) : (
                <TR>
                  <TD className="py-xl text-sm text-text-secondary" colSpan={7}>
                    İncelenecek yorum bulunmuyor.
                  </TD>
                </TR>
              )}
            </TBody>
          </Table>
        </TableWrapper>
      </div>
    </PageShell>
  );
}
