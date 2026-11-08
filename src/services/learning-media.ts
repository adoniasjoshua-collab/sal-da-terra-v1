import type { WorldContent } from "./learning";

export type WorldVideo = { youtubeId: string; title: string };

// Optional reinforcement approved by the administrator (ADR-011). It lives
// outside the immutable content JSON and is keyed by version, so a later
// version needs its own approval. It never gates progress or grants XP.
const WORLD_VIDEOS: Record<string, WorldVideo> = {
  "voce-faz-parte:2": { youtubeId: "cbDFFbUHgTU", title: "Você faz parte! Como Cristo nos recebeu" },
};

export function worldVideo(content: Pick<WorldContent, "slug" | "version">): WorldVideo | null {
  return WORLD_VIDEOS[`${content.slug}:${content.version}`] ?? null;
}

// Only validated identifiers reach the privacy-enhanced embed domain.
export function youtubeEmbedUrl(youtubeId: string): string | null {
  if (!/^[\w-]{11}$/.test(youtubeId)) return null;
  return `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0&playsinline=1`;
}
