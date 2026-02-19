import React, { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchFixturesForLeagues } from "@/services/footballService";
import type { Match } from "@/data/matches";
import VideoPlayer from "@/components/VideoPlayer";
import Footer from "@/components/Footer";

const MatchPage = () => {
  const params = useParams();
  const id = params.id ?? "";
  const [match, setMatch] = React.useState<Match | null>(null);
  const pandaBase = "https://p4.pandalive.live/albaplayer/";
  const starzBase = "https://a.yallashoot2026.com/albaplayer/";
  const iframeSrc = useMemo(() => {
    if (match?.backupIframe && match.backupIframe.trim().length > 0) return match.backupIframe.trim();
    if (match?.channelSlug && match.channelSlug.trim().length > 0) {
      const base = match.playerServer === "starz" ? starzBase : pandaBase;
      return `${base}${match.channelSlug.trim()}/`;
    }
    return null;
  }, [match, pandaBase, starzBase]);

  React.useEffect(() => {
    let mounted = true;
    void fetchFixturesForLeagues()
      .then((arr) => {
        if (!mounted) return;
        const m = arr.find((mm) => mm.id === id) ?? null;
        setMatch(m);
      })
      .catch(() => void 0);
    return () => {
      mounted = false;
    };
  }, [id]);

  function currentUrl(): string {
    try {
      return window.location.href;
    } catch {
      return `https://dourina.com/match/${id}`;
    }
  }
  function matchName(): string {
    if (!match) return "the match";
    const home = match.homeTeam ?? "";
    const away = match.awayTeam ?? "";
    const name = [home, away].filter(Boolean).join(" vs ");
    return name || (match.league ?? "the match");
  }
  function whatsappLink(): string {
    const msg = `Watch ${matchName()} live on DAWRINA: ${currentUrl()}`;
    const encoded = encodeURIComponent(msg);
    return `https://wa.me/?text=${encoded}`;
  }
  function telegramLink(): string {
    const url = encodeURIComponent(currentUrl());
    const text = encodeURIComponent(`Watch ${matchName()} live on DAWRINA`);
    return `https://t.me/share/url?url=${url}&text=${text}`;
  }
  function openShare(href: string) {
    try {
      window.open(href, "_blank", "noopener,noreferrer");
    } catch {
      // ignore
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container flex items-center gap-4 py-4">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">الرجوع</Link>
          <div className="h-4 w-px bg-border" />
          <span className="text-sm text-muted-foreground">{match?.league ?? "المباراة"}</span>
        </div>
      </header>
      <main className="container py-6 flex-1">
        <div className="mx-auto max-w-3xl">
          {iframeSrc ? (
            <div className="relative w-full overflow-hidden rounded-xl border border-white/10 bg-black/60 shadow-xl backdrop-blur-md">
              <div className="pointer-events-none absolute right-2 top-2 z-[9999] rounded-md bg-black/70 px-3 py-1 text-xs font-bold text-white">
                دورينا
              </div>
              <iframe
                src={iframeSrc}
                className="aspect-video w-full h-full"
                width="100%"
                height="100%"
                allow="autoplay; fullscreen"
                referrerPolicy="strict-origin-when-cross-origin"
                sandbox="allow-forms allow-same-origin allow-scripts"
              />
              <div className="pointer-events-none absolute left-3 right-24 bottom-3 z-[9999]">
                <div className="w-full rounded-md bg-black/40 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white">
                  LIVE ON DOURINA.COM
                </div>
              </div>
            </div>
          ) : (
            <VideoPlayer streamUrls={match?.streamUrl ? [match.streamUrl] : []} initialIndex={0} />
          )}
          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => openShare(whatsappLink())}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-[0_0_10px_rgba(16,185,129,0.6)] hover:bg-emerald-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="h-4 w-4" aria-hidden="true">
                <path fill="#ffffff" d="M26.6 5.4A13.2 13.2 0 0 0 5.3 24.5L4 28l3.6-.9A13.1 13.1 0 0 0 16 29.2C22.6 29.2 28 23.8 28 17.2c0-3.5-1.4-6.8-3.8-9.3zM16 26.9c-2.1 0-4.1-.6-5.9-1.8l-.4-.3-2.4.6.7-2.3-.3-.5a10.9 10.9 0 1 1 8.3 4.3zm6.1-8.1c-.3-.2-1.7-.8-2-1-.3-.1-.5-.2-.7.2s-.8 1-1 1.3c-.2.3-.4.3-.7.1-.3-.2-1.4-.5-2.7-1.7-1-.9-1.7-2-1.9-2.3-.2-.3 0-.5.2-.7s.3-.4.4-.6c.2-.2.2-.4 0-.6-.1-.2-.7-1.7-.9-2.3-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.1-1.2 2.6s1.2 3 1.4 3.2c.2.2 2.4 3.6 5.8 4.9 2.1.7 2.9.8 3.9.7.6-.1 1.7-.7 2-1.4s.3-1.3.2-1.4c-.1-.1-.3-.2-.6-.4z" />
              </svg>
              Share on WhatsApp
            </button>
            <button
              type="button"
              onClick={() => openShare(telegramLink())}
              className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-3 py-2 text-xs font-bold text-white shadow-[0_0_10px_rgba(2,132,199,0.6)] hover:bg-sky-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="h-4 w-4" aria-hidden="true">
                <path fill="#ffffff" d="M28.9 4.6c-.5-.4-1.2-.4-1.8-.2L3.2 14.2c-.7.3-1.2.9-1.2 1.6 0 .7.4 1.3 1.1 1.6l6.4 2.4 2.3 7.3c.2.7.8 1.2 1.5 1.3h.1c.6 0 1.2-.4 1.5-1l3.6-6 6.5 4.8c.5.4 1.2.5 1.8.2.6-.3 1-.9 1.1-1.5l3-18.7c.1-.7-.2-1.4-.8-1.8zM13.6 23.9l-1.8-5.6 10.8-9.1-12.9 7.3-6-2.3L27 7.3 13.6 23.9z" />
              </svg>
              Share on Telegram
            </button>
          </div>
          {Array.isArray(match?.streamUrl ? [match.streamUrl] : []) && (match?.streamUrl ? [match.streamUrl] : []).length > 1 && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              {(match?.streamUrl ? [match.streamUrl] : []).map((s, idx) => (
                <a key={idx} href={s} target="_blank" rel="noreferrer" className="rounded-md border px-3 py-2 text-xs text-muted-foreground hover:text-foreground">
                  رابط {idx + 1}
                </a>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MatchPage;
