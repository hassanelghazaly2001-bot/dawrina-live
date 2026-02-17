import { TodaysMatchesSection } from "@/components/TodaysMatchesSection";
import { supabase } from "@/lib/supabase";
import { useEffect, useRef, useState } from "react";
import { fetchFixturesForLeagues } from "@/services/footballService";

type Ad = {
  id: string;
  title?: string;
  type?: "image" | "script";
  placement?: "header" | "sidebar" | "inline";
  image_url?: string;
  link_url?: string;
  ad_script?: string;
  active?: boolean;
};

function AdScriptRenderer({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.innerHTML = "";
    const srcMatch = html.match(/<script[^>]*src=["']([^"']+)["'][^>]*><\/script>/i);
    if (srcMatch && srcMatch[1]) {
      const s = document.createElement("script");
      s.src = srcMatch[1];
      s.async = true;
      el.appendChild(s);
    } else {
      const s = document.createElement("script");
      s.text = html;
      el.appendChild(s);
    }
  }, [html]);
  return <div ref={ref} />;
}

const Index = () => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [matchesCount, setMatchesCount] = useState<number>(0);
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("ads")
        .select("id, title, image_url, link_url, type, placement, ad_script, active")
        .eq("active", true);
      if (Array.isArray(data)) {
        const mapped = data.map((raw: unknown) => {
          const a = raw as { id: number | string; title?: string; type?: "image" | "script"; placement?: "header" | "sidebar" | "inline"; image_url?: string; link_url?: string; ad_script?: string; active?: boolean };
          return {
            id: String(a.id),
            title: a.title,
            type: a.type,
            placement: a.placement,
            image_url: a.image_url,
            link_url: a.link_url,
            ad_script: a.ad_script,
            active: !!a.active,
          };
        });
        console.log("LOG: Ads from DB ->", mapped);
        setAds(mapped);
      }
    })().catch(() => void 0);
  }, []);
  useEffect(() => {
    void fetchFixturesForLeagues()
      .then((arr) => {
        setMatchesCount(Array.isArray(arr) ? arr.length : 0);
      })
      .catch(() => setMatchesCount(0));
  }, []);

  function renderAd(a: Ad) {
    if (!a.active) return null;
    if (a.type === "image" && a.image_url) {
      return a.link_url ? (
        <a href={a.link_url} target="_blank" rel="noopener noreferrer" className="block">
          <img src={a.image_url} alt={a.title ?? "Ad"} className="mx-auto max-h-24" />
        </a>
      ) : (
        <img src={a.image_url} alt={a.title ?? "Ad"} className="mx-auto max-h-24" />
      );
    }
    if (a.type === "script" && a.ad_script) {
      return <AdScriptRenderer html={a.ad_script} />;
    }
    return null;
  }
  return (
    <div className="min-h-screen bg-background">
      <h1 className="text-xs text-muted-foreground ps-2">Matches count: {matchesCount}</h1>
      {ads.filter((a) => a.placement === "header").map((a) => (
        <div key={a.id} className="border-b border-border bg-card/40 py-2">{renderAd(a)}</div>
      ))}
      {/* Header */}
      <header className="border border-amber-400/40 bg-black/40 shadow-xl shadow-black/40 backdrop-blur-md">
        <div className="container py-5">
          <div className="flex flex-col items-start gap-2 text-left">
            <div className="flex items-center justify-start gap-3 w-full">
            <span className="text-2xl drop-shadow-[0_0_10px_rgba(34,197,94,0.55)] sm:text-3xl" aria-hidden>
              ⚽
            </span>
            <h1 className="flex flex-wrap items-baseline justify-start gap-2 text-2xl font-bold tracking-tight sm:text-3xl" dir="rtl">
              <span className="font-cairo text-[#FFD700] drop-shadow-[0_0_12px_rgba(255,215,0,0.5)]">
                دورينا
              </span>
              <span className="font-inter text-muted-foreground/90" dir="ltr">
                |
              </span>
              <span className="font-inter text-foreground tracking-[0.15em]" dir="ltr">
                DAWRINA
              </span>
            </h1>
            </div>
            <p className="text-sm font-medium text-muted-foreground" dir="rtl">
              الكرة العربية والعالمية
            </p>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="container max-w-6xl mx-auto py-10">
        <TodaysMatchesSection />
        {ads.filter((a) => a.placement === "inline").map((a) => (
          <div key={a.id} className="my-6 rounded-xl border border-border bg-card/40 p-4">{renderAd(a)}</div>
        ))}
      </main>
    </div>
  );
};

export default Index;
