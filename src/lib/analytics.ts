import { supabase } from "@/lib/supabase";

declare global {
  interface Window {
    plausible?: (eventName: string, opts?: Record<string, unknown>) => void;
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function classifyReferrer(ref: string): string {
  const r = (ref || "").toLowerCase();
  if (!r) return "direct";
  if (r.includes("google.")) return "google";
  if (r.includes("facebook.")) return "facebook";
  if (r.includes("instagram.")) return "instagram";
  if (r.includes("twitter.") || r.includes("x.com")) return "twitter";
  if (r.includes("t.me") || r.includes("telegram")) return "telegram";
  if (r.includes("whatsapp")) return "whatsapp";
  if (r.includes("bing.")) return "bing";
  if (r.includes("yahoo.")) return "yahoo";
  return "other";
}

export function initAnalytics() {
  const domain = import.meta.env.VITE_PLAUSIBLE_DOMAIN as string | undefined;
  const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;
  if (domain) {
    const s = document.createElement("script");
    s.defer = true;
    s.src = "https://plausible.io/js/plausible.js";
    s.setAttribute("data-domain", domain);
    document.head.appendChild(s);
  }
  if (gaId) {
    const s1 = document.createElement("script");
    s1.async = true;
    s1.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(s1);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag(...args: unknown[]) {
      const dl = (window.dataLayer as unknown[]) || [];
      dl.push(args as unknown);
      window.dataLayer = dl;
    };
    window.gtag("js", new Date() as unknown as number);
    window.gtag("config", gaId);
  }
}

export function trackPageView(path: string) {
  try {
    const ref = document.referrer || "";
    const src = classifyReferrer(ref);
    if (typeof window.plausible === "function") {
      window.plausible("pageview", { u: path });
    }
    if (typeof window.gtag === "function") {
      window.gtag("event", "page_view", { page_path: path, page_location: window.location.href });
    }
    void supabase
      .from("page_views")
      .insert({
        path,
        referrer: ref,
        source: src,
        ts: new Date().toISOString(),
      });
  } catch {
    void 0;
  }
}
