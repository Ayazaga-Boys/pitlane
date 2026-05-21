import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { AdminModerationStory } from "@/lib/admin-data";

function mapAudienceLabel(audience: AdminModerationStory["audience"]) {
  if (audience === "followers") return "takipçiler";
  if (audience === "private") return "private";
  return "public";
}

export function StoriesGrid({ stories }: { stories: AdminModerationStory[] }) {
  return (
    <div className="grid gap-lg md:grid-cols-2 xl:grid-cols-3">
      {stories.map((story) => (
        <Link key={story.id} className="surface-panel overflow-hidden transition hover:border-surface-3 hover:bg-surface-2" href={`/stories/${story.id}`}>
          <div className="aspect-[9/16] bg-surface-2">
            {story.mediaPreviewUrl ? (
              <img alt={`${story.authorName} story preview`} className="h-full w-full object-cover" src={story.mediaPreviewUrl} />
            ) : (
              <div className="flex h-full items-center justify-center p-lg text-sm text-text-secondary">Preview hazır değil</div>
            )}
          </div>
          <div className="space-y-md p-lg">
            <div>
              <p className="font-medium text-text-primary">{story.authorName}</p>
              <p className="mt-1 text-xs text-text-tertiary">@{story.authorUsername}</p>
            </div>
            <div className="flex flex-wrap gap-xs">
              <Badge tone={story.deletedAt ? "error" : story.isExpiringSoon ? "warning" : "success"}>
                {story.deletedAt ? "kaldırıldı" : story.isExpiringSoon ? "acil" : "aktif"}
              </Badge>
              <Badge tone="default">{mapAudienceLabel(story.audience)}</Badge>
              <Badge tone="info">{story.viewsCount} görüntüleme</Badge>
            </div>
            <div className="grid gap-sm text-xs text-text-tertiary sm:grid-cols-2">
              <p>Oluşturulma: {story.createdAt}</p>
              <p>Bitiş: {story.expiresAt}</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
