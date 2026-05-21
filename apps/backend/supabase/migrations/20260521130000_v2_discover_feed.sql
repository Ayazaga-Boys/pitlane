CREATE MATERIALIZED VIEW IF NOT EXISTS public.post_discovery_scores AS
WITH like_counts AS (
  SELECT post_id, COUNT(*)::INTEGER AS like_count
  FROM public.post_likes
  GROUP BY post_id
),
comment_counts AS (
  SELECT post_id, COUNT(*)::INTEGER AS comment_count
  FROM public.comments
  WHERE is_deleted = FALSE
  GROUP BY post_id
),
post_metrics AS (
  SELECT
    posts.id AS post_id,
    posts.author_id,
    profiles.is_private AS author_is_private,
    posts.visibility,
    posts.created_at,
    COALESCE(like_counts.like_count, 0) AS like_count,
    COALESCE(comment_counts.comment_count, 0) AS comment_count,
    LEAST(
      1.0,
      ((COALESCE(like_counts.like_count, 0) + (COALESCE(comment_counts.comment_count, 0) * 2))::NUMERIC / 100.0)
    ) AS engagement_rate,
    GREATEST(
      0.0,
      1.0 - (EXTRACT(EPOCH FROM (NOW() - posts.created_at)) / 604800.0)
    ) AS recency_decay
  FROM public.posts
  JOIN public.profiles ON profiles.id = posts.author_id
  LEFT JOIN like_counts ON like_counts.post_id = posts.id
  LEFT JOIN comment_counts ON comment_counts.post_id = posts.id
  WHERE posts.deleted_at IS NULL
)
SELECT
  post_id,
  author_id,
  author_is_private,
  visibility,
  created_at,
  like_count,
  comment_count,
  engagement_rate,
  recency_decay,
  ((0.5 * engagement_rate) + (0.3 * recency_decay)) AS base_score,
  NOW() AS refreshed_at
FROM post_metrics;

CREATE UNIQUE INDEX IF NOT EXISTS idx_post_discovery_scores_post ON public.post_discovery_scores(post_id);
CREATE INDEX IF NOT EXISTS idx_post_discovery_scores_rank
  ON public.post_discovery_scores(base_score DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_discovery_scores_author ON public.post_discovery_scores(author_id);

CREATE OR REPLACE FUNCTION public.refresh_post_discovery_scores()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW public.post_discovery_scores;
END;
$$;

GRANT SELECT ON public.post_discovery_scores TO authenticated;
GRANT SELECT ON public.post_discovery_scores TO service_role;
GRANT EXECUTE ON FUNCTION public.refresh_post_discovery_scores() TO service_role;
