import { describe, expect, it } from "vitest";
import { worldVideo, youtubeEmbedUrl } from "../src/services/learning-media";

describe("world videos", () => {
  it("serves the approved video only for its reviewed version", () => {
    expect(worldVideo({ slug: "voce-faz-parte", version: 2 })?.youtubeId).toBe("cbDFFbUHgTU");
    expect(worldVideo({ slug: "voce-faz-parte", version: 3 })).toBeNull();
    expect(worldVideo({ slug: "outro-mundo", version: 2 })).toBeNull();
  });

  it("embeds only validated identifiers on the privacy-enhanced domain", () => {
    expect(youtubeEmbedUrl("cbDFFbUHgTU")).toMatch(/^https:\/\/www\.youtube-nocookie\.com\/embed\/cbDFFbUHgTU\?/);
    expect(youtubeEmbedUrl("cbDFFbUHgTU")).toContain("rel=0");
    expect(youtubeEmbedUrl("x\"><script>")).toBeNull();
    expect(youtubeEmbedUrl("https://evil.example/abc")).toBeNull();
  });
});
