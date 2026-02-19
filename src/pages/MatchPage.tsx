import React, { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import type { Match } from "@/data/matches";
import VideoPlayer from "@/components/VideoPlayer";
import { Bell } from "lucide-react";
import { supabase } from "@/lib/supabase";
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
    void supabase
      .from("matches")
      .select("*")
      .eq("id", id)
      .single()
      .then((res) => {
        if (!mounted) return;
        const row = res.data as { [k: string]: unknown } | null;
        if (!row) {
          setMatch(null);
          return;
        }
        const m: Match = {
          id: String(row.id ?? id),
          homeTeam: String(row.home_team ?? ""),
          awayTeam: String(row.away_team ?? ""),
          homeLogo: row.home_logo ? String(row.home_logo) : undefined,
          awayLogo: row.away_logo ? String(row.away_logo) : undefined,
          league: String(row.league ?? ""),
          leagueIcon: row.league_icon ? String(row.league_icon) : undefined,
          date: String(row.date ?? ""),
          time: String(row.time ?? ""),
          status: (String(row.status ?? "upcoming") as "live" | "upcoming" | "finished"),
          streamUrl: String(row.stream_server_1 ?? "") || "",
          streamUrl2: String(row.stream_server_2 ?? "") || "",
          channelSlug: row.channel_slug ? String(row.channel_slug) : undefined,
          channel: row.channel ? String(row.channel) : undefined,
          backupIframe: row.backup_iframe ? String(row.backup_iframe) : undefined,
          playerServer: (row.player_server ? String(row.player_server) : undefined) as
            | "panda"
            | "starz"
            | undefined,
          commentator: row.commentator ? String(row.commentator) : undefined,
          stadium: row.stadium ? String(row.stadium) : undefined,
        };
        setMatch(m);
      })
      .catch(() => void 0);
    return () => {
      mounted = false;
    };
  }, [id]);

  function buildStartISO(m: Match | null): string | undefined {
    if (!m) return undefined;
    const today = new Date().toISOString().split("T")[0];
    const hasTime = !!(m.time && m.time.trim().length >= 4);
    const d = hasTime ? new Date(`${today}T${m.time!.trim()}`) : new Date();
    if (isNaN(d.getTime())) return undefined;
    return d.toISOString();
  }

  React.useEffect(() => {
    if (!match) return;
    const urlHere = (() => {
      try {
        return window.location.href;
      } catch {
        return `https://dourina.com/match/${id}`;
      }
    })();
    const home = match.homeTeam ?? "";
    const away = match.awayTeam ?? "";
    const league = match.league ?? "";
    const name = [home, away].filter(Boolean).join(" vs ");
    const isArabic = true;
    const title =
      isArabic && home && away
        ? `${home} ضد ${away} بث مباشر | ${league} | دورينا`
        : `${name || league} Live Stream | DAWRINA`;
    const desc =
      isArabic && home && away
        ? `شاهد ${home} ضد ${away} بث مباشر الآن على دورينا — موعد مباراة ${league} وروابط البث بجودة عالية.`
        : `Watch ${name} live now on DAWRINA — match time, league and links.`;
    const keywords = [
      "بث مباشر",
      "موعد مباراة",
      "يلا شوت",
      home,
      away,
      league,
      "live stream",
      "match today",
      "dawrina",
    ]
      .filter(Boolean)
      .join(", ");
    document.title = title;
    function setMeta(name: string, content: string) {
      let el = document.querySelector(`meta[name='${name}']`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("name", name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    }
    setMeta("description", desc);
    setMeta("keywords", keywords);
    const statusMap: Record<NonNullable<Match["status"]>, string> = {
      upcoming: "EventScheduled",
      live: "EventInProgress",
      finished: "EventCompleted",
    };
    const startDateISO = buildStartISO(match);
    const originHost = (() => {
      try {
        return window.location.origin.startsWith("http") ? window.location.origin : `https://${window.location.host}`;
      } catch {
        return "https://dourina.com";
      }
    })();
    const imageUrl = `${originHost}/logo.png`;
    const ld = {
      "@context": "https://schema.org",
      "@type": "SportsEvent",
      name: `${home} vs ${away}`.trim() || league || "Match",
      startDate: startDateISO,
      eventStatus: statusMap[match.status ?? "upcoming"],
      location: match.stadium
        ? { "@type": "Place", name: match.stadium }
        : undefined,
      image: imageUrl,
      competitor: [
        { "@type": "SportsTeam", name: home || "Home Team" },
        { "@type": "SportsTeam", name: away || "Away Team" },
      ],
      url: urlHere,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
        url: urlHere,
      },
    };
    let script = document.getElementById("seo-sportsevent") as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.type = "application/ld+json";
      script.id = "seo-sportsevent";
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(ld);
    return () => {
      // keep title; remove JSON-LD to avoid stale data when navigating
      const s = document.getElementById("seo-sportsevent");
      if (s && s.parentNode) s.parentNode.removeChild(s);
    };
  }, [match, id]);

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

  async function enableNotifications() {
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") return;
      const reg = await navigator.serviceWorker.ready;
      const vapidPublicKey = import.meta.env?.VITE_VAPID_PUBLIC_KEY || "";
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey ? urlBase64ToUint8Array(vapidPublicKey) : undefined,
      });
      const body = {
        endpoint: sub.endpoint,
        keys: (sub.toJSON() as { keys?: { p256dh?: string; auth?: string } }).keys,
      };
      await supabase.from("push_subscriptions").upsert({ endpoint: body.endpoint, p256dh: body.keys?.p256dh, auth: body.keys?.auth });
    } catch {
      // ignore
    }
  }

  function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container flex items-center gap-4 py-4">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">الرجوع</Link>
          <div className="h-4 w-px bg-border" />
          <span className="text-sm text-muted-foreground">{match?.league ?? "المباراة"}</span>
          <button
            type="button"
            onClick={enableNotifications}
            className="ml-auto inline-flex items-center gap-1 rounded-full border border-emerald-400 bg-black/40 px-2.5 py-1 text-[11px] font-bold text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.6)] hover:bg-black/60"
            title="Enable Notifications"
          >
            <Bell className="h-3.5 w-3.5" />
            التفعيل
          </button>
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
                sandbox="allow-forms allow-scripts"
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
          {match && (
            <div className="mt-3 mb-1 flex items-center text-[0.75rem]">
              <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <span aria-hidden>🏟️</span>
                  <span>الملعب:</span>
                  <span className="text-foreground">{match.stadium && match.stadium.trim().length > 0 ? match.stadium : "—"}</span>
                </span>
                <span className="mx-1">|</span>
                <span className="inline-flex items-center gap-1">
                  <span aria-hidden>🎙️</span>
                  <span>المعلق:</span>
                  <span className="text-foreground">{match.commentator && match.commentator.trim().length > 0 ? match.commentator : "—"}</span>
                </span>
                <span className="mx-1">|</span>
                <span className="inline-flex items-center gap-1">
                  <span aria-hidden>📺</span>
                  <span>القناة:</span>
                  <span className="text-foreground">{match.channel && match.channel.trim().length > 0 ? match.channel : "—"}</span>
                </span>
              </div>
            </div>
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
