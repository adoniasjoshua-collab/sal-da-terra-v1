"use client";

import { useState } from "react";
import { worldVideo, youtubeEmbedUrl } from "@/services/learning-media";
import type { WorldContent } from "@/services/learning";

// Nothing is requested from YouTube until the learner presses play, which
// saves mobile data and avoids third-party requests on page load.
export function WorldVideo({ content }: { content: WorldContent }) {
  const [playing, setPlaying] = useState(false);
  const video = worldVideo(content);
  const src = video && youtubeEmbedUrl(video.youtubeId);
  if (!video || !src) return null;
  return <section className="card p-5 sm:p-7" aria-labelledby="world-video-title">
    <p className="text-xs font-black uppercase tracking-[.14em] text-[#176b49]">Vídeo · opcional</p>
    <h2 id="world-video-title" className="mt-1 text-xl font-black">{video.title}</h2>
    <p className="mt-2 text-sm leading-6">Assista aqui mesmo, sem sair do portal, para ajudar a fixar o conteúdo. Prefere ler? As leituras abaixo trazem o conteúdo deste mundo.</p>
    <div className="mt-4 aspect-video overflow-hidden rounded-xl bg-[#143d2c]">
      {playing
        ? <iframe className="h-full w-full" src={src} title={video.title} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />
        : <button type="button" className="flex h-full w-full flex-col items-center justify-center gap-3 text-white" onClick={() => setPlaying(true)}>
            <svg className="h-16 w-16" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="30" fill="#e6c861" /><path d="M26 20 L46 32 L26 44 Z" fill="#143d2c" /></svg>
            <span className="font-black">Assistir ao vídeo</span>
          </button>}
    </div>
  </section>;
}
