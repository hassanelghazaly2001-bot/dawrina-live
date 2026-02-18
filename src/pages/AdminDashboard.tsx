import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { t } from "@/lib/i18n";
import type { Match } from "@/data/matches";
import { Star } from "lucide-react";
import { supabase } from "@/lib/supabase";
 

const adTypesMap = { image: "Image Ad", id: "Ad Unit ID", script: "Custom Script" };
const placementMap = { header: "Header", sidebar: "Sidebar", inline: "Inline" };

const AdminDashboard = () => {
  const ADMIN_BYPASS = false;
  const [authed, setAuthed] = useState(false);
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [autoStatus, setAutoStatus] = useState<string | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [entries, setEntries] = useState<Record<string, string[]>>({});
  const [statuses, setStatuses] = useState<Record<string, "live" | "upcoming" | "finished">>({});
  const [metas, setMetas] = useState<Record<string, { tvChannel: string; commentator: string; stadium: string }>>({});
  const [showNew, setShowNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const [adminTab, setAdminTab] = useState<"today" | "tomorrow">("today");
  const [adminChannelFilter, setAdminChannelFilter] = useState<"all" | "bein" | "ssc" | "others">("all");
  const [selectedServer, setSelectedServer] = useState<"panda" | "starz">("panda");
  const [selectedDate, setSelectedDate] = useState<"today" | "tomorrow">("today");
  const [isSaving, setIsSaving] = useState(false);
  const [ads, setAds] = useState<{ id: string; title?: string; image_url?: string; link_url?: string; active?: boolean; type?: "image" | "id" | "script"; ad_id?: number; ad_script?: string; placement?: "header" | "sidebar" | "inline" }[]>([]);
  const [showAdForm, setShowAdForm] = useState(false);
  const adFormRef = useRef<HTMLFormElement | null>(null);
  const [adTypeSelections, setAdTypeSelections] = useState<Record<string, "image" | "id" | "script">>({});
  const [placementSelections, setPlacementSelections] = useState<Record<string, "header" | "sidebar" | "inline">>({});
  const PANDA_SLUGS = [
    ...Array.from({ length: 10 }, (_, i) => `bein-${i + 1}`),
    ...Array.from({ length: 8 }, (_, i) => `ssc-${i + 1}`),
    "on-time",
    "mbc-action",
  ];
  const STARZ_SLUGS = ["sports-d1", "sports-d2", "sports-d3", "sports-d4"];
  const PANDA_CURATED = ["bein-9", "bein-10", "ssc-2", "ssc-3", "ssc-4", "ssc-5", "ssc-8"];
  const STARZ_CURATED = ["sports-d1", "sports-d2", "sports-d3", "sports-d4"];
  const [quickDateFilter, setQuickDateFilter] = useState<"none" | "fixedToday" | "fixedTomorrow">("none");
  const todayISO = (() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  })();
  const tomorrowISO = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  })();
  const [formData, setFormData] = useState({
    homeTeam: "",
    awayTeam: "",
    homeLogo: "",
    awayLogo: "",
    league: "",
    date: "",
    time: "",
    stream1: "",
    stream2: "",
    channelSlug: "",
    backupIframe: "",
    tvChannel: "",
    commentator: "",
    stadium: "",
  });
  const [newMatch, setNewMatch] = useState({
    homeTeam: "",
    awayTeam: "",
    homeLogo: "",
    awayLogo: "",
    league: "",
    date: "",
    time: "",
    stream1: "",
    stream2: "",
    channelSlug: "",
    backupIframe: "",
  });

 

  useEffect(() => {
    setAuthed(false);
  }, []);

  useEffect(() => {
    if (!authed) return;
    let mounted = true;
    (async () => {
      const { data, error } = await supabase.from("matches").select("*");
      if (!mounted) return;
      if (error || !Array.isArray(data)) {
        setMatches([]);
        setEntries({});
        setStatuses({});
        setMetas({});
        setAutoStatus("تعذر تحميل المباريات من قاعدة البيانات");
        return;
      }
      setMatches(
        data.map((row: { [k: string]: unknown }) => ({
          id: String(row.id),
          homeTeam: row.home_team ?? "",
          awayTeam: row.away_team ?? "",
          league: row.league ?? "",
          leagueIcon: undefined,
          date: row.date ?? "",
          time: row.time ?? "",
          status: (String(row.status ?? "upcoming").toLowerCase() as "live" | "upcoming" | "finished"),
          channelSlug: (row as { server_slug?: string }).server_slug ?? undefined,
          homeLogo: (row.logo_home as string | undefined) ?? undefined,
          awayLogo: (row.logo_away as string | undefined) ?? undefined,
          streamUrl: (row.stream_server_1 as string | undefined) ?? "",
          commentator: (row.commentator as string | undefined) ?? undefined,
          channel: (row.channel as string | undefined) ?? undefined,
          stadium: (row.stadium as string | undefined) ?? undefined,
        }))
      );
      const initialEntries: Record<string, string[]> = {};
      const initialStatuses: Record<string, "live" | "upcoming" | "finished"> = {};
      const initialMetas: Record<string, { tvChannel: string; commentator: string; stadium: string }> = {};
      for (const row of data as Array<{ [k: string]: unknown }>) {
        const idStr = String(row.id);
        {
          const s1Unknown = (row as { stream_server_1?: unknown }).stream_server_1;
          const s1 = typeof s1Unknown === "string" ? s1Unknown : "";
          initialEntries[idStr] = [s1 || "", "", "", ""];
        }
        initialStatuses[idStr] = (String(row.status ?? "upcoming").toLowerCase() as "live" | "upcoming" | "finished");
        initialMetas[idStr] = {
          tvChannel: "",
          commentator: (row.commentator as string | undefined) ?? "",
          stadium: "",
        };
      }
      setEntries(initialEntries);
      setStatuses(initialStatuses);
      setMetas(initialMetas);
      setAutoStatus(`تم تحميل ${data.length} مباراة من قاعدة البيانات`);
    })().catch(() => {
      setMatches([]);
      setAutoStatus("تعذر تحميل المباريات من قاعدة البيانات");
    });
    return () => {
      mounted = false;
    };
  }, [authed]);

  useEffect(() => {
    // Remove any previously injected ad scripts when entering Admin
    const scripts = Array.from(document.querySelectorAll('script[data-ad-script="true"]'));
    for (const s of scripts) {
      try {
        s.remove();
      } catch {
        void 0;
      }
    }
  }, []);
  useEffect(() => {
    async function loadAds() {
      const { data, error } = await supabase
        .from("ads")
        .select("ad_id, title, image_url, redirect_url, type, position, is_active, code_html");
      if (!error && Array.isArray(data)) {
        type SupabaseAdRow = {
          ad_id: number | string;
          title?: string;
          image_url?: string;
          redirect_url?: string;
          type?: "image" | "id" | "script";
          position?: "header" | "sidebar" | "inline";
          is_active?: boolean;
          code_html?: string;
        };
        setAds(
          (data as SupabaseAdRow[]).map((a) => ({
            id: String(a.ad_id),
            title: a.title,
            image_url: a.image_url,
            link_url: a.redirect_url,
            active: !!a.is_active,
            type: a.type ?? "image",
            placement: (a.position ?? "header") as "header" | "sidebar" | "inline",
            ad_id: undefined,
            ad_script: undefined,
          }))
        );
        const typesInit: Record<string, "image" | "id" | "script"> = {};
        const placementsInit: Record<string, "header" | "sidebar" | "inline"> = {};
        for (const a of data as SupabaseAdRow[]) {
          const idStr = String(a.ad_id);
          typesInit[idStr] = a.type ?? "image";
          placementsInit[idStr] = (a.position ?? "header") as "header" | "sidebar" | "inline";
        }
        setAdTypeSelections(typesInit);
        setPlacementSelections(placementsInit);
      }
    }
    if (authed) {
      void loadAds();
    }
  }, [authed]);
  useEffect(() => {
    function onScannerPaste(e: Event) {
      const detail = (e as CustomEvent<string>).detail as string | undefined;
      const slug = detail ?? "";
      if (!slug) return;
      if (!showNew) return;
      const f = formRef.current;
      if (!f) return;
      const elSlug = f.querySelector<HTMLSelectElement>('select[name="channelSlug"]');
      const elServer = f.querySelector<HTMLSelectElement>('select[name="playerServer"]');
      if (elSlug) elSlug.value = slug;
      const isStarz = slug.startsWith("sports-d");
      if (elServer) elServer.value = isStarz ? "starz" : "panda";
      setSelectedServer(isStarz ? "starz" : "panda");
      setStatus(`تم إدراج القناة تلقائيًا: ${slug}`);
    }
    window.addEventListener("scanner-last-slug-set", onScannerPaste as EventListener);
    return () => {
      window.removeEventListener("scanner-last-slug-set", onScannerPaste as EventListener);
    };
  }, [showNew]);

  function handleInputChange(name: keyof typeof formData, value: string) {
    console.log("Typing:", value);
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function updateMatchField(id: string, key: keyof Match, value: string) {
    setMatches((prev) => prev.map((m) => (m.id === id ? { ...m, [key]: value } : m)));
  }

  function handleLogin() {
    setErr(null);
    if (pwd === "260501") {
      setAuthed(true);
      return;
    }
    setErr("Access Denied");
  }

  function updateEntry(id: string, idx: number, value: string) {
    setEntries((prev) => {
      const arr = prev[id] ? [...prev[id]] : ["", "", "", ""];
      arr[idx] = value;
      return { ...prev, [id]: arr };
    });
  }

  async function save(id: string) {
    if (isSaving) return;
    setIsSaving(true);
    setStatus("Saving...");
    const getVal = (name: string) =>
      (document.querySelector<HTMLInputElement | HTMLSelectElement>(`[name="${name}"][data-id="${id}"]`)?.value ?? "").trim();
    const homeTeam = getVal("homeTeam");
    const awayTeam = getVal("awayTeam");
    const league = getVal("league");
    const time = getVal("time");
    const homeLogo = getVal("homeLogo");
    const awayLogo = getVal("awayLogo");
    const stream1 = getVal("stream1");
    const stream2 = getVal("stream2");
    const otherSlug = getVal("otherSlug");
    const channelSlug = otherSlug || getVal("channelSlug");
    const backupIframe = getVal("backupIframe");
    const playerServer = getVal("playerServer") as "panda" | "starz";
    if (channelSlug && !otherSlug) {
      const valid =
        (playerServer === "panda" && PANDA_SLUGS.includes(channelSlug)) ||
        (playerServer === "starz" && STARZ_SLUGS.includes(channelSlug));
      if (!valid) {
        setStatus("الرجاء اختيار slug مطابق للسيرفر المختار");
        return;
      }
    }
    const tvChannel = getVal("tvChannel");
    const commentator = getVal("commentator");
    const stadium = getVal("stadium");
    const channelText = getVal("channel");
    const statusVal = getVal("status") as "live" | "upcoming" | "finished";
    const cleanPayload = {
      home_team: homeTeam || null,
      away_team: awayTeam || null,
      logo_home: homeLogo || null,
      logo_away: awayLogo || null,
      league: league || null,
      time: time || null,
      date: selectedDate,
      channel: channelText || null,
      commentator: commentator || null,
      stream_server_1: stream1 || null,
      stream_server_2: stream2 || null,
      external_iframe: backupIframe || null,
      server_slug: channelSlug || null,
      stadium: stadium || null,
      status: statusVal || "upcoming",
      active: true,
    };
    console.log("Sending to Supabase:", cleanPayload);
    try {
      const { error } = await supabase.from("matches").insert([cleanPayload]);
      if (error) throw error;
      console.log("SUPABASE_MATCH_SAVED", cleanPayload);
      const { data } = await supabase.from("matches").select("*");
      if (Array.isArray(data)) {
        setMatches(
          data.map((row: { [k: string]: unknown }) => ({
            id: String(row.id),
            homeTeam: row.home_team ?? "",
            awayTeam: row.away_team ?? "",
            league: row.league ?? "",
            leagueIcon: undefined,
            date: row.date ?? "",
            time: row.time ?? "",
            status: (String(row.status ?? "upcoming").toLowerCase() as "live" | "upcoming" | "finished"),
            channelSlug: (row as { server_slug?: string }).server_slug ?? undefined,
            homeLogo: (row.logo_home as string | undefined) ?? undefined,
            awayLogo: (row.logo_away as string | undefined) ?? undefined,
            streamUrl: (row.stream_server_1 as string | undefined) ?? "",
            commentator: (row.commentator as string | undefined) ?? undefined,
            channel: (row.channel as string | undefined) ?? undefined,
            stadium: (row.stadium as string | undefined) ?? undefined,
          }))
        );
      }
      setStatus("Saved");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "تعذر حفظ المباراة";
      alert(msg);
      setStatus(msg);
    } finally {
      setIsSaving(false);
    }
  }

  function updateMeta(id: string, key: "tvChannel" | "commentator" | "stadium", value: string) {
    setMetas((prev) => ({ ...prev, [id]: { ...(prev[id] ?? { tvChannel: "", commentator: "", stadium: "" }), [key]: value } }));
  }

  async function handleSaveAd(id: string) {
    console.log("Save button clicked!", { id, authed });
    if (!authed) {
      alert("Access denied");
      return;
    }
    const getVal = (name: string) => (document.querySelector<HTMLInputElement>(`[name="${name}"][data-id="${id}"]`)?.value ?? "").trim();
    const getValArea = (name: string) => (document.querySelector<HTMLTextAreaElement>(`[name="${name}"][data-id="${id}"]`)?.value ?? "").trim();
    const getChecked = (name: string) => !!document.querySelector<HTMLInputElement>(`[name="${name}"][data-id="${id}"]`)?.checked;
    const title = getVal("ad_title");
    const type = adTypeSelections[id] ?? (ads.find((x) => x.id === id)?.type ?? "image");
    const placement = placementSelections[id] ?? (ads.find((x) => x.id === id)?.placement ?? "header");
    const image_url = getVal("ad_image_url");
    const link_url = getVal("ad_link_url");
    const ad_id_raw = getVal("ad_ad_id");
    const ad_id = ad_id_raw ? Number.parseInt(ad_id_raw, 10) : undefined;
    const active = getChecked("ad_active");
    const ad_script = getValArea("ad_script");
    const adData = { title, type, placement, image_url, link_url, ad_id, active, ad_script };
    // eslint-disable-next-line no-console
    console.log("Button clicked! Ad data:", adData);
    if (!title || !placement) {
      alert("يرجى إدخال العنوان والمكان");
      return;
    }
    if (type === "image" && !image_url) {
      alert("يرجى إدخال رابط الصورة");
      return;
    }
    if (type === "id" && !ad_id_raw) {
      alert("يرجى إدخال معرّف الإعلان");
      return;
    }
    if (type === "script" && !ad_script) {
      alert("يرجى إدخال كود الإعلان");
      return;
    }
    const payload = {
      title: title || null,
      position: placement,
      type,
      image_url: type === "image" ? (image_url || null) : null,
      redirect_url: type === "image" ? (link_url || null) : null,
      ad_script: type === "script" ? (ad_script || null) : null,
      code_html: type === "script" ? (ad_script || null) : null,
      is_active: !!active,
    };
    // eslint-disable-next-line no-console
    console.log("Attempting to save to Supabase...");
    const { data, error } = await supabase.from("ads").update(payload).eq("ad_id", id).select("*").single();
    if (error) {
      // eslint-disable-next-line no-console
      console.error("Supabase Error Details:", error);
      alert("Error: " + (error.message || "تعذر حفظ الإعلان"));
      setStatus(error.message || "تعذر حفظ الإعلان");
      return;
    }
    // eslint-disable-next-line no-console
    console.log("Success! Data saved:", data);
    console.log("SUPABASE_AD_UPDATED", payload);
    setAds((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              id,
              title: (data as { title?: string }).title,
              image_url: (data as { image_url?: string }).image_url,
              link_url: (data as { redirect_url?: string }).redirect_url,
              active: !!(data as { is_active?: boolean }).is_active,
              type: (data as { type?: "image" | "id" | "script" }).type,
              placement: ((data as { placement?: "header" | "sidebar" | "inline"; position?: "header" | "sidebar" | "inline" }).placement ??
                (data as { placement?: "header" | "sidebar" | "inline"; position?: "header" | "sidebar" | "inline" }).position ??
                "header") as "header" | "sidebar" | "inline",
              ad_id: (data as { ad_id?: number }).ad_id ?? undefined,
              ad_script: (data as { ad_script?: string }).ad_script ?? undefined,
            }
          : a
      )
    );
    setStatus("تم حفظ الإعلان");
  }

  async function handleAddMatch(match: Match): Promise<string | null> {
    const timeStr = String(match.time ?? "").trim();
    const normalizedDate =
      match.date === "today" || match.date === "tomorrow"
        ? match.date
        : match.date === todayISO
        ? "today"
        : match.date === tomorrowISO
        ? "tomorrow"
        : selectedDate;
    const finalData = {
      home_team: match.homeTeam || null,
      away_team: match.awayTeam || null,
      logo_home: match.homeLogo ?? null,
      logo_away: match.awayLogo ?? null,
      league: match.league || null,
      time: timeStr || null,
      date: normalizedDate,
      channel: match.channel ?? null,
      commentator: match.commentator ?? null,
      stream_server_1: match.streamUrl || null,
      stream_server_2: match.streamUrl2 ?? null,
      external_iframe: match.backupIframe ?? null,
      server_slug: match.channelSlug ?? null,
      stadium: match.stadium ?? null,
      status: match.status || "upcoming",
      active: true,
    };
    console.log("Sending to Supabase:", finalData);
    console.log("FINAL DATA TO SUPABASE:", finalData);
    const { data, error } = await supabase.from("matches").insert([finalData]).select("*");
    if (error || !Array.isArray(data) || data.length === 0) {
      alert(error.message || "تعذر حفظ المباراة في Supabase");
      return null;
    }
    console.log("SUPABASE_MATCH_SAVED", finalData);
    setStatus("تم حفظ المباراة في Supabase");
    const insertedId = String((data[0] as { id: string }).id);
    return insertedId;
  }

  async function addNewMatch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    console.log("Button clicked, data:", formData);
    setStatus("Saving...");
    const fd = new FormData(e.currentTarget);
    const homeTeam = String(fd.get("homeTeam") ?? "").trim();
    const awayTeam = String(fd.get("awayTeam") ?? "").trim();
    const league = String(fd.get("league") ?? "").trim();
    const time = String(fd.get("time") ?? "").trim();
    if (!homeTeam || !awayTeam || !league || !time) {
      setStatus("يرجى إدخال بيانات المباراة الأساسية");
      return;
    }
    const dateVal = selectedDate;
    const edited = editingId;
    const leagueIcon = String(fd.get("leagueLogo") ?? "").trim() || undefined;
    const otherSlug = String(fd.get("otherSlug") ?? "").trim();
    const channelSlug = (otherSlug || String(fd.get("channelSlug") ?? "").trim()) || undefined;
    const backupIframe = String(fd.get("backupIframe") ?? "").trim() || undefined;
    let playerServer = (String(fd.get("playerServer") ?? "").trim() as "panda" | "starz") || undefined;
    if (otherSlug) {
      playerServer = otherSlug.startsWith("sports-d") ? "starz" : "panda";
    }
    if (channelSlug && playerServer && !otherSlug) {
      const valid =
        (playerServer === "panda" && PANDA_SLUGS.includes(channelSlug)) ||
        (playerServer === "starz" && STARZ_SLUGS.includes(channelSlug));
      if (!valid) {
        setStatus("الرجاء اختيار slug مطابق للسيرفر المختار");
        return;
      }
    }
    const channelText = String(fd.get("channel") ?? "").trim();
    const commentator = String(fd.get("commentator") ?? "").trim();
    const stadium = String(fd.get("stadium") ?? "").trim();
    const stream1 = String(fd.get("stream1") ?? "").trim();
    const stream2 = String(fd.get("stream2") ?? "").trim();
    const match: Match = {
      id: "",
      homeTeam,
      awayTeam,
      league,
      leagueIcon,
      date: dateVal,
      time,
      status: (String(fd.get("statusNew") ?? "upcoming") as "live" | "upcoming" | "finished"),
      streamUrl: stream1 || "",
      streamUrl2: stream2 || "",
      channelSlug,
      channel: channelText || undefined,
      backupIframe,
      playerServer,
      homeLogo: (String(fd.get("homeLogo") ?? "").trim() || undefined),
      awayLogo: (String(fd.get("awayLogo") ?? "").trim() || undefined),
      commentator,
      stadium,
    };
    try {
      const insertedId = await handleAddMatch(match);
      const { data } = await supabase.from("matches").select("*");
      if (Array.isArray(data)) {
        setMatches(
          data.map((row: { [k: string]: unknown }) => ({
            id: String(row.id),
            homeTeam: row.home_team ?? "",
            awayTeam: row.away_team ?? "",
            league: row.league ?? "",
            leagueIcon: undefined,
            date: row.date ?? "",
            time: row.time ?? "",
            status: (String(row.status ?? "upcoming").toLowerCase() as "live" | "upcoming" | "finished"),
            channelSlug: (row as { server_slug?: string }).server_slug ?? undefined,
            homeLogo: (row.logo_home as string | undefined) ?? undefined,
            awayLogo: (row.logo_away as string | undefined) ?? undefined,
            streamUrl: (row.stream_server_1 as string | undefined) ?? "",
            commentator: (row.commentator as string | undefined) ?? undefined,
            channel: (row.channel as string | undefined) ?? undefined,
            stadium: (row.stadium as string | undefined) ?? undefined,
          }))
        );
      }
      if (insertedId) {
        setEntries((prev) => ({ ...prev, [insertedId]: [String(fd.get("stream1") ?? ""), String(fd.get("stream2") ?? ""), "", ""] }));
        setStatuses((prev) => ({ ...prev, [insertedId]: (String(fd.get("statusNew") ?? "upcoming") as "live" | "upcoming" | "finished") }));
        setMetas((prev) => ({ ...prev, [insertedId]: { tvChannel: channelText, commentator, stadium } }));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "تعذر حفظ المباراة";
      alert(msg);
      setStatus(msg);
      return;
    } finally {
      setIsSaving(false);
    }
    if (formRef.current) formRef.current.reset();
    setSelectedDate("today");
    setShowNew(false);
    setEditingId(null);
    setFormData({
      homeTeam: "",
      awayTeam: "",
      homeLogo: "",
      awayLogo: "",
      league: "",
      date: "",
      time: "",
      stream1: "",
      stream2: "",
      tvChannel: "",
      commentator: "",
      stadium: "",
    });
    setStatus(edited ? "تم تحديث المباراة" : "تمت إضافة المباراة");
  }

  function deleteMatch(id: string) {
    (async () => {
      await supabase.from("matches").delete().eq("id", id);
      const { data } = await supabase.from("matches").select("*");
      if (Array.isArray(data)) {
        setMatches(
          data.map((row: { [k: string]: unknown }) => ({
            id: String(row.id),
            homeTeam: row.home_team ?? "",
            awayTeam: row.away_team ?? "",
            league: row.league ?? "",
            leagueIcon: undefined,
            date: row.date ?? "",
            time: row.time ?? "",
            status: (String(row.status ?? "upcoming").toLowerCase() as "live" | "upcoming" | "finished"),
            channelSlug: (row as { server_slug?: string }).server_slug ?? undefined,
            homeLogo: (row.logo_home as string | undefined) ?? undefined,
            awayLogo: (row.logo_away as string | undefined) ?? undefined,
            streamUrl: (row.stream_server_1 as string | undefined) ?? "",
            commentator: (row.commentator as string | undefined) ?? undefined,
            channel: (row.channel as string | undefined) ?? undefined,
            stadium: (row.stadium as string | undefined) ?? undefined,
          }))
        );
      }
    })().catch(() => void 0);
    setEntries((prev) => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
    setStatuses((prev) => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
    setMetas((prev) => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
    setStatus("تم حذف المباراة");
  }

  function setTopMatch(id: string) {
    (async () => {
      await supabase.from("matches").update({ is_top_match: true }).eq("id", id);
      const { data } = await supabase.from("matches").select("*");
      if (Array.isArray(data)) {
        setMatches(
          data.map((row: { [k: string]: unknown }) => ({
            id: String(row.id),
            homeTeam: row.home_team ?? "",
            awayTeam: row.away_team ?? "",
            league: row.league ?? "",
            leagueIcon: undefined,
            date: row.date ?? "",
            time: row.time ?? "",
            status: (String(row.status ?? "upcoming").toLowerCase() as "live" | "upcoming" | "finished"),
            channelSlug: (row.channel as string | undefined) ?? undefined,
            homeLogo: (row.logo_home as string | undefined) ?? undefined,
            awayLogo: (row.logo_away as string | undefined) ?? undefined,
            streamUrl: (row.stream_server_1 as string | undefined) ?? "",
            commentator: (row.commentator as string | undefined) ?? undefined,
            isTopMatch: Boolean(row.is_top_match ?? false),
          }))
        );
      }
      setStatus("تم تعيين المباراة كقمة اليوم");
    })().catch(() => setStatus("تعذر تعيين قمة اليوم"));
  }

  function beginEdit(id: string) {
    const m = matches.find((mm) => mm.id === id);
    if (!m) return;
    const arr = entries[id] ?? ["", "", "", ""];
    const meta = metas[id] ?? { tvChannel: "", commentator: "", stadium: "" };
    setEditingId(id);
    setShowNew(true);
    setStatus("تحرير مباراة موجودة");
    setTimeout(() => {
      const f = formRef.current;
      if (!f) return;
      const set = (name: string, val: string) => {
        const elI = f.querySelector<HTMLInputElement>(`input[name="${name}"]`);
        if (elI) elI.value = val;
        const elS = f.querySelector<HTMLSelectElement>(`select[name="${name}"]`);
        if (elS) elS.value = val;
      };
      set("homeTeam", m.homeTeam ?? "");
      set("awayTeam", m.awayTeam ?? "");
      set("homeLogo", m.homeLogo ?? "");
      set("awayLogo", m.awayLogo ?? "");
      set("league", m.league ?? "");
      set("time", m.time ?? "");
      set("channelSlug", m.channelSlug ?? "");
        set("channel", m.channel ?? "");
      set("backupIframe", m.backupIframe ?? "");
      set("playerServer", m.playerServer ?? "panda");
      setSelectedServer((m.playerServer as "panda" | "starz") ?? "panda");
      set("stream1", arr[0] ?? "");
      set("stream2", arr[1] ?? "");
      set("commentator", meta.commentator ?? "");
      set("stadium", meta.stadium ?? "");
        setFormData((prev) => ({ ...prev, stadium: meta.stadium ?? "" }));
      const today = new Date();
      const ty = today.getFullYear();
      const tm = String(today.getMonth() + 1).padStart(2, "0");
      const td = String(today.getDate()).padStart(2, "0");
      const todayISO = `${ty}-${tm}-${td}`;
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const oy = tomorrow.getFullYear();
      const om = String(tomorrow.getMonth() + 1).padStart(2, "0");
      const od = String(tomorrow.getDate()).padStart(2, "0");
      const tomorrowISO = `${oy}-${om}-${od}`;
      const rToday = f.querySelector<HTMLInputElement>('input[name="dateRadio"][value="today"]');
      const rTomorrow = f.querySelector<HTMLInputElement>('input[name="dateRadio"][value="tomorrow"]');
      if (m.date === "tomorrow") {
        if (rTomorrow) rTomorrow.checked = true;
        setSelectedDate("tomorrow");
      } else {
        if (rToday) rToday.checked = true;
        setSelectedDate("today");
      }
      f.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  console.log("ADMIN_DASHBOARD_RENDER", { authed, matchesCount: matches.length, showNew });
  console.log("Matches to render:", matches);
  if (!authed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="mx-auto max-w-sm rounded-xl border border-border bg-card/40 p-4 w-full">
          <input
            type="password"
            className="mb-2 w-full rounded-md border bg-card p-2 text-sm"
            placeholder="Admin Code"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
          />
          <button
            type="button"
            onClick={handleLogin}
            className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            دخول
          </button>
          {err && <p className="mt-2 text-center text-sm text-red-500">{err}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container flex items-center gap-4 py-4">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">{t.back}</Link>
          <div className="h-4 w-px bg-border" />
          <span className="text-sm text-muted-foreground">Admin Dashboard</span>
        </div>
      </header>
      <main className="container py-6">
        <div className="rounded-xl border border-border bg-card/40 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">لوحة الإدارة</h2>
            <span className="text-xs text-muted-foreground">Feb 14, 2026</span>
          </div>
          {autoStatus && <p className="mb-3 text-xs text-muted-foreground">{autoStatus}</p>}
          <div className="mb-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowNew((s) => !s)}
              className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
            >
              إضافة مباراة جديدة
            </button>
          </div>
          {showNew && (
            <form ref={formRef} onSubmit={(e) => { addNewMatch(e); }} className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <input name="homeTeam" className="rounded-md border bg-card p-2 text-sm" placeholder="اسم الفريق (الصفحة الرئيسية)" defaultValue={editingId ? (matches.find((m) => m.id === editingId)?.homeTeam ?? "") : ""} />
              <input name="homeLogo" className="rounded-md border bg-card p-2 text-sm" placeholder="رابط شعار الفريق (الصفحة الرئيسية)" defaultValue={editingId ? (matches.find((m) => m.id === editingId)?.homeLogo ?? "") : ""} />
              <input name="awayTeam" className="rounded-md border bg-card p-2 text-sm" placeholder="اسم الفريق (الضيف)" defaultValue={editingId ? (matches.find((m) => m.id === editingId)?.awayTeam ?? "") : ""} />
              <input name="awayLogo" className="rounded-md border bg-card p-2 text-sm" placeholder="رابط شعار الفريق (الضيف)" defaultValue={editingId ? (matches.find((m) => m.id === editingId)?.awayLogo ?? "") : ""} />
              <input name="league" className="rounded-md border bg-card p-2 text-sm" placeholder="الدوري" defaultValue={editingId ? (matches.find((m) => m.id === editingId)?.league ?? "") : ""} />
              <div className="col-span-full flex items-center gap-3 rounded-md border bg-card p-2 text-xs">
                <span className="text-muted-foreground">التاريخ:</span>
                <label className="inline-flex items-center gap-1">
                  <input
                    type="radio"
                    name="dateRadio"
                    value="today"
                    checked={selectedDate === "today"}
                    onChange={() => setSelectedDate("today")}
                  />
                  اليوم
                </label>
                <label className="inline-flex items-center gap-1">
                  <input
                    type="radio"
                    name="dateRadio"
                    value="tomorrow"
                    checked={selectedDate === "tomorrow"}
                    onChange={() => setSelectedDate("tomorrow")}
                  />
                  الغد
                </label>
              </div>
              <input name="time" className="rounded-md border bg-card p-2 text-sm" placeholder="الوقت (HH:MM)" defaultValue={editingId ? (matches.find((m) => m.id === editingId)?.time ?? "") : ""} />
              <input name="stream1" className="rounded-md border bg-card p-2 text-sm" placeholder="Stream Server 1" defaultValue={editingId ? ((entries[editingId] ?? ["", "", "", ""])[0] ?? "") : ""} />
              <input name="stream2" className="rounded-md border bg-card p-2 text-sm" placeholder="Stream Server 2" defaultValue={editingId ? ((entries[editingId] ?? ["", "", "", ""])[1] ?? "") : ""} />
              <select
                name="playerServer"
                className="rounded-md border bg-card p-2 text-sm"
                defaultValue={editingId ? (matches.find((m) => m.id === editingId)?.playerServer ?? "panda") : "panda"}
                onChange={(e) => setSelectedServer((e.target.value as "panda" | "starz") ?? "panda")}
              >
                <option value="panda">Panda Server</option>
                <option value="starz">Starz/Yalla Server</option>
              </select>
              <select
                name="channelSlug"
                className="rounded-md border bg-card p-2 text-sm"
                defaultValue={
                  editingId
                    ? (matches.find((m) => m.id === editingId)?.channelSlug ?? (selectedServer === "panda" ? PANDA_SLUGS[0] : STARZ_SLUGS[0]))
                    : (selectedServer === "panda" ? PANDA_SLUGS[0] : STARZ_SLUGS[0])
                }
              >
                {(selectedServer === "panda" ? PANDA_SLUGS : STARZ_SLUGS).map((slug) => (
                  <option key={slug} value={slug}>{slug}</option>
                ))}
              </select>
            <div className="col-span-full rounded-md border bg-card p-2 text-xs">
              <div className="mb-1 font-semibold text-foreground">اختيار سريع حسب السيرفر</div>
              {selectedServer === "panda" ? (
                <>
                  <div className="mb-1 text-[11px] text-muted-foreground">beIN Sports</div>
                  <div className="mb-2 flex flex-wrap gap-1">
                    {Array.from({ length: 10 }, (_, i) => `bein-${i + 1}`).map((slug) => (
                      <button
                        key={slug}
                        type="button"
                        className="rounded-md bg-emerald-600 px-2 py-1 text-white hover:bg-emerald-700"
                        onClick={() => {
                          const f = formRef.current;
                          const el = f?.querySelector<HTMLSelectElement>('select[name="playerServer"]');
                          const elSlug = f?.querySelector<HTMLSelectElement>('select[name="channelSlug"]');
                          if (el) el.value = "panda";
                          setSelectedServer("panda");
                          if (elSlug) elSlug.value = slug;
                        }}
                      >
                        {slug}
                      </button>
                    ))}
                  </div>
                  <div className="mb-1 text-[11px] text-muted-foreground">SSC Saudi</div>
                  <div className="mb-2 flex flex-wrap gap-1">
                    {Array.from({ length: 8 }, (_, i) => `ssc-${i + 1}`).map((slug) => (
                      <button
                        key={slug}
                        type="button"
                        className="rounded-md bg-emerald-600 px-2 py-1 text-white hover:bg-emerald-700"
                        onClick={() => {
                          const f = formRef.current;
                          const el = f?.querySelector<HTMLSelectElement>('select[name="playerServer"]');
                          const elSlug = f?.querySelector<HTMLSelectElement>('select[name="channelSlug"]');
                          if (el) el.value = "panda";
                          setSelectedServer("panda");
                          if (elSlug) elSlug.value = slug;
                        }}
                      >
                        {slug}
                      </button>
                    ))}
                  </div>
                  <div className="mb-1 text-[11px] text-muted-foreground">Others</div>
                  <div className="mb-2 flex flex-wrap gap-1">
                    {["on-time", "mbc-action"].map((slug) => (
                      <button
                        key={slug}
                        type="button"
                        className="rounded-md bg-emerald-600 px-2 py-1 text-white hover:bg-emerald-700"
                        onClick={() => {
                          const f = formRef.current;
                          const el = f?.querySelector<HTMLSelectElement>('select[name="playerServer"]');
                          const elSlug = f?.querySelector<HTMLSelectElement>('select[name="channelSlug"]');
                          if (el) el.value = "panda";
                          setSelectedServer("panda");
                          if (elSlug) elSlug.value = slug;
                        }}
                      >
                        {slug}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-1 text-[11px] text-muted-foreground">Starz/Yalla</div>
                  <div className="mb-2 flex flex-wrap gap-1">
                    {["sports-d1", "sports-d2", "sports-d3", "sports-d4"].map((slug) => (
                      <button
                        key={slug}
                        type="button"
                        className="rounded-md bg-sky-600 px-2 py-1 text-white hover:bg-sky-700"
                        onClick={() => {
                          const f = formRef.current;
                          const el = f?.querySelector<HTMLSelectElement>('select[name="playerServer"]');
                          const elSlug = f?.querySelector<HTMLSelectElement>('select[name="channelSlug"]');
                          if (el) el.value = "starz";
                          setSelectedServer("starz");
                          if (elSlug) elSlug.value = slug;
                        }}
                      >
                        {slug}
                      </button>
                    ))}
                  </div>
                </>
              )}
              <div className="mt-1">
                <input name="otherSlug" className="w-full rounded-md border bg-card p-2 text-sm" placeholder="Other Slugs (Manual override)" />
              </div>
            </div>
              <input name="backupIframe" className="rounded-md border bg-card p-2 text-sm" placeholder="رابط iframe خارجي (اتركه فارغًا كمبدّل احتياطي)" defaultValue={editingId ? (matches.find((m) => m.id === editingId)?.backupIframe ?? "") : ""} />
              <input name="commentator" className="rounded-md border bg-card p-2 text-sm" placeholder="المعلق" defaultValue={editingId ? ((metas[editingId]?.commentator ?? "")) : ""} />
              <input name="channel" className="rounded-md border bg-card p-2 text-sm" placeholder="القناة الناقلة" defaultValue={editingId ? ((matches.find((m) => m.id === editingId)?.channel ?? "")) : ""} />
              <input
                name="stadium"
                className="rounded-md border bg-card p-2 text-sm"
                placeholder="الملعب"
                value={formData.stadium}
                onChange={(e) => handleInputChange("stadium", e.target.value)}
              />
              <div className="col-span-full">
                <select name="statusNew" className="w-full rounded-md border bg-card p-2 text-sm" defaultValue={editingId ? (statuses[editingId] ?? (matches.find((m) => m.id === editingId)?.status ?? "upcoming")) : "upcoming"}>
                  <option value="upcoming">Upcoming</option>
                  <option value="live">Live</option>
                  <option value="finished">Finished</option>
                </select>
              </div>
              <div className="col-span-full">
                <button
                  type="submit"
                  disabled={isSaving}
                  className={[
                    "rounded-md px-3 py-1.5 text-xs font-medium",
                    isSaving ? "bg-muted text-muted-foreground cursor-not-allowed" : "bg-primary text-primary-foreground hover:bg-primary/90",
                  ].join(" ")}
                >
                  {isSaving ? "جارٍ الحفظ..." : (editingId ? "تحديث" : "حفظ")}
                </button>
              </div>
            </form>
          )}
          <div className="overflow-x-auto">
            {matches.length === 0 ? (
              <div className="rounded-xl border border-border bg-card/60 p-6 text-center text-sm text-muted-foreground">
                لا توجد مباريات حالياً. أضف مباراة جديدة
              </div>
            ) : (
              <>
                <div className="mb-3 inline-flex items-center justify-center rounded-full border border-amber-400/40 bg-black/10 p-0.5 text-xs">
                  {[
                    { id: "today", label: "مباريات اليوم" },
                    { id: "tomorrow", label: "مباريات الغد" },
                  ].map((tab) => {
                    const isActive = adminTab === (tab.id as "today" | "tomorrow");
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setAdminTab(tab.id as "today" | "tomorrow")}
                        className={[
                          "relative mx-0.5 flex items-center justify-center rounded-full px-2.5 py-1.5 font-medium transition-all",
                          isActive
                            ? "bg-amber-500 text-amber-950 shadow-[0_0_12px_rgba(245,158,11,0.35)]"
                            : "text-muted-foreground hover:bg-amber-500/10",
                        ].join(" ")}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
                <div className="mb-3 inline-flex items-center justify-center rounded-full border border-amber-400/40 bg-black/10 p-0.5 text-xs">
                  {[
                    { id: "all", label: "الكل" },
                    { id: "bein", label: "beIN Sports" },
                    { id: "ssc", label: "SSC" },
                    { id: "others", label: "Others" },
                  ].map((tab) => {
                    const isActive = adminChannelFilter === (tab.id as "all" | "bein" | "ssc" | "others");
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setAdminChannelFilter(tab.id as "all" | "bein" | "ssc" | "others")}
                        className={[
                          "relative mx-0.5 flex items-center justify-center rounded-full px-2.5 py-1.5 font-medium transition-all",
                          isActive
                            ? "bg-emerald-500 text-emerald-950 shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                            : "text-muted-foreground hover:bg-emerald-500/10",
                        ].join(" ")}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
                <div className="mb-3 inline-flex items-center justify-center rounded-full border border-emerald-400/40 bg-black/10 p-0.5 text-xs">
                  {[
                    { id: "fixedToday", label: "Today (Feb 15, 2026)" },
                    { id: "fixedTomorrow", label: "Tomorrow (Feb 16, 2026)" },
                  ].map((tab) => {
                    const isActive = quickDateFilter === (tab.id as "fixedToday" | "fixedTomorrow");
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setQuickDateFilter(tab.id as "fixedToday" | "fixedTomorrow")}
                        className={[
                          "relative mx-0.5 flex items-center justify-center rounded-full px-2.5 py-1.5 font-medium transition-all",
                          isActive
                            ? "bg-emerald-500 text-emerald-950 shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                            : "text-muted-foreground hover:bg-emerald-500/10",
                        ].join(" ")}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setQuickDateFilter("none")}
                    className="ml-2 rounded-full px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-emerald-500/10"
                  >
                    Reset
                  </button>
                </div>
                {(() => {
                  const targetISO =
                    quickDateFilter === "fixedToday"
                      ? todayISO
                      : quickDateFilter === "fixedTomorrow"
                      ? tomorrowISO
                      : adminTab === "today"
                      ? todayISO
                      : tomorrowISO;
                  const dayFiltered = matches.filter((m) => {
                    const md = m.date ?? "";
                    const normalized =
                      md === "today" ? todayISO : md === "tomorrow" ? tomorrowISO : md;
                    return normalized ? normalized === targetISO : true;
                  });
                  const getAdjustedDate = (m: Match) => {
                    if (!m.time || m.time === "–") return null;
                    const [hh, mm] = (m.time ?? "").split(":");
                    const h = Number.parseInt(hh ?? "", 10);
                    const m2 = Number.parseInt(mm ?? "", 10);
                    if (Number.isNaN(h) || Number.isNaN(m2)) return null;
                    const d = new Date();
                    if (m.date) {
                      const iso = m.date === "today" ? todayISO : m.date === "tomorrow" ? tomorrowISO : m.date;
                      const [y, mo, da] = iso.split("-").map((x) => Number.parseInt(x, 10));
                      if (!Number.isNaN(y) && !Number.isNaN(mo) && !Number.isNaN(da)) {
                        d.setFullYear(y);
                        d.setMonth(mo - 1);
                        d.setDate(da);
                      }
                    }
                    d.setSeconds(0, 0);
                    d.setHours(h - 3, m2, 0, 0);
                    return d;
                  };
                  const adjustedKey = (m: Match) => {
                    const d = getAdjustedDate(m);
                    if (!d) return Number.MAX_SAFE_INTEGER;
                    return d.getHours() * 60 + d.getMinutes();
                  };
                  const getGroup = (m: Match) => {
                    const slug = (m.channelSlug ?? "").toLowerCase();
                    const ch = (m.tvChannel ?? "").toLowerCase();
                    if (slug.includes("bein") || ch.includes("bein")) return "bein";
                    if (slug.includes("ssc") || ch.includes("ssc")) return "ssc";
                    return "others";
                  };
                  const grouped: Record<"bein" | "ssc" | "others", Match[]> = { bein: [], ssc: [], others: [] };
                  for (const m of dayFiltered) {
                    grouped[getGroup(m)].push(m);
                  }
                  const sortByTime = (arr: Match[]) => [...arr].sort((a, b) => adjustedKey(a) - adjustedKey(b));
                  const sections =
                    adminChannelFilter === "all"
                      ? [
                          { id: "bein", label: "beIN Sports", data: sortByTime(grouped.bein) },
                          { id: "ssc", label: "SSC", data: sortByTime(grouped.ssc) },
                          { id: "others", label: "Others", data: sortByTime(grouped.others) },
                        ]
                      : [
                          {
                            id: adminChannelFilter,
                            label:
                              adminChannelFilter === "bein"
                                ? "beIN Sports"
                                : adminChannelFilter === "ssc"
                                ? "SSC"
                                : "Others",
                            data: sortByTime(grouped[adminChannelFilter]),
                          },
                        ];
                  return sections.map((sec) => (
                    <div key={sec.id} className="mb-6">
                      <h3 className="mb-2 text-sm font-semibold text-foreground">{sec.label}</h3>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-muted-foreground">
                            <th className="p-2 text-start">المباراة</th>
                            <th className="p-2 text-start">الوقت</th>
                            <th className="p-2 text-start">الدوري</th>
                            <th className="p-2 text-start">إجراءات</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sec.data.map((m) => {
                            const hasSlug = Boolean(m.channelSlug && m.channelSlug.trim().length > 0);
                            const hasBackup = Boolean(m.backupIframe && m.backupIframe.trim().length > 0);
                            const color = hasSlug ? "bg-emerald-500" : hasBackup ? "bg-sky-500" : "bg-red-600";
                            const realT = m.time ?? "";
                            const adjD = getAdjustedDate(m);
                            const adjT = adjD
                              ? `${String(adjD.getHours()).padStart(2, "0")}:${String(adjD.getMinutes()).padStart(2, "0")}`
                              : realT || "–";
                            return (
                              <tr key={m.id} className="border-t border-border">
                                <td className="p-2">
                                  <span className={["mr-2 inline-block h-2 w-2 rounded-full", color].join(" ")} aria-hidden />
                                  {m.homeTeam} <span className="text-muted-foreground">vs</span> {m.awayTeam}
                                </td>
                                <td className="p-2">
                                  <div className="flex flex-col">
                                    <span className="font-medium">{adjT}</span>
                                    <span className="text-[11px] text-muted-foreground">{realT} → {adjT}</span>
                                  </div>
                                </td>
                                <td className="p-2">{m.league}</td>
                                <td className="p-2">
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setTopMatch(m.id)}
                                      className={[
                                        "inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium",
                                        m.isTopMatch ? "bg-emerald-600 text-white" : "bg-sky-600 text-white",
                                      ].join(" ")}
                                      title="تعيين كقمة اليوم"
                                    >
                                      <Star className="h-3.5 w-3.5" />
                                      {m.isTopMatch ? "القمة ✓" : "تعيين القمة"}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => beginEdit(m.id)}
                                      className="rounded-md bg-amber-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-600"
                                    >
                                      تعديل
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => deleteMatch(m.id)}
                                      className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                                    >
                                      حذف
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ));
                })()}
              </>
            )}
          </div>
          <div className="mt-6 rounded-xl border border-border bg-card/40 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">إدارة الإعلانات</h2>
              <button
                type="button"
                onClick={() => setShowAdForm((s) => !s)}
                className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
              >
                إضافة إعلان جديد
              </button>
            </div>
            {showAdForm && (
              <form ref={adFormRef} onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const title = String(fd.get("title") ?? "").trim();
                const type = String(fd.get("ad_type") ?? "image") as "image" | "id" | "script";
                const placement = String(fd.get("placement") ?? "header") as "header" | "sidebar" | "inline";
                const image_url = String(fd.get("image_url") ?? "").trim();
                const link_url = String(fd.get("link_url") ?? "").trim();
                const ad_id_raw = String(fd.get("ad_id") ?? "").trim();
                const script = String(fd.get("ad_script") ?? "").trim();
                const active = String(fd.get("active") ?? "false") === "on";
                const adDataNew = { title, type, placement, image_url, link_url, ad_id_raw, script, active };
                // eslint-disable-next-line no-console
                console.log("Button clicked! Ad data (new):", adDataNew);
                (async () => {
                  const payload = {
                    title: title || null,
                    position: placement,
                    type,
                    image_url: type === "image" ? (image_url || null) : null,
                    redirect_url: type === "image" ? (link_url || null) : null,
                    ad_script: type === "script" ? (script || null) : null,
                    code_html: type === "script" ? (script || null) : null,
                    is_active: active,
                  };
                  // eslint-disable-next-line no-console
                  console.log("Attempting to save to Supabase...");
                  const { data, error } = await supabase.from("ads").insert(payload).select("*").single();
                  if (!error && data) {
                    // eslint-disable-next-line no-console
                    console.log("Success! Data saved:", data);
                    setAds((prev) => [...prev, {
                      id: String((data as { ad_id?: number | string }).ad_id),
                      title: (data as { title?: string }).title,
                      image_url: (data as { image_url?: string }).image_url,
                      link_url: (data as { redirect_url?: string }).redirect_url,
                      active: !!(data as { is_active?: boolean }).is_active,
                      type: (data as { type?: "image" | "id" | "script" }).type,
                      placement: ((data as { position?: "header" | "sidebar" | "inline" }).position ?? "header") as "header" | "sidebar" | "inline",
                    }]);
                    setShowAdForm(false);
                    setStatus("تم حفظ الإعلان");
                  } else {
                    // eslint-disable-next-line no-console
                    console.error("Supabase Error Details:", error);
                    setStatus(error?.message || "تعذر حفظ الإعلان");
                  }
                })().catch(() => setStatus("تعذر حفظ الإعلان"));
              }} className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                <input name="title" className="rounded-md border bg-card p-2 text-sm" placeholder="عنوان الإعلان" />
                <select name="ad_type" className="rounded-md border bg-card p-2 text-sm" defaultValue="image">
                  <option value="image">صورة + رابط</option>
                  <option value="id">معرّف إعلان (رقمي)</option>
                  <option value="script">كود مخصص (HTML/JS)</option>
                </select>
                <select name="placement" className="rounded-md border bg-card p-2 text-sm" defaultValue="header">
                  <option value="header">Header</option>
                  <option value="sidebar">Sidebar</option>
                  <option value="inline">Inline</option>
                </select>
                <input name="image_url" className="rounded-md border bg-card p-2 text-sm" placeholder="رابط صورة الإعلان" />
                <input name="link_url" className="rounded-md border bg-card p-2 text-sm" placeholder="رابط التحويل عند الضغط" />
                <input name="ad_id" className="rounded-md border bg-card p-2 text-sm" placeholder="معرّف الإعلان (رقمي)" />
                <textarea name="ad_script" className="rounded-md border bg-card p-2 text-sm" placeholder="كود HTML/JS" rows={4} />
                <label className="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" name="active" />
                  فعال
                </label>
                <div className="col-span-full">
                  <button type="submit" className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90">
                    حفظ الإعلان
                  </button>
                </div>
              </form>
            )}
            <div className="overflow-x-auto">
              {ads.length === 0 ? (
                <div className="rounded-xl border border-border bg-card/60 p-6 text-center text-sm text-muted-foreground">
                  لا توجد إعلانات حالياً
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-muted-foreground">
                      <th className="p-2 text-start">العنوان</th>
                      <th className="p-2 text-start">النوع</th>
                      <th className="p-2 text-start">المكان</th>
                      <th className="p-2 text-start">الصورة</th>
                      <th className="p-2 text-start">الرابط</th>
                      <th className="p-2 text-start">معرّف</th>
                      <th className="p-2 text-start">كود</th>
                      <th className="p-2 text-start">فعّال</th>
                      <th className="p-2 text-start">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ads.map((a) => (
                      <tr key={a.id} className="border-t border-border">
                        <td className="p-2">
                          <input name="ad_title" data-id={a.id} defaultValue={a.title ?? ""} className="w-full rounded-md border bg-card p-2 text-sm" />
                        </td>
                        <td className="p-2">
                          <select
                            className="rounded-md border bg-card p-2 text-sm"
                            defaultValue={a.type ?? "image"}
                            onChange={(e) => setAdTypeSelections((prev) => ({ ...prev, [a.id]: (e.target.value as "image" | "id" | "script") ?? "image" }))}
                          >
                            <option value="image">صورة + رابط</option>
                            <option value="id">معرّف إعلان (رقمي)</option>
                            <option value="script">كود مخصص</option>
                          </select>
                          <div className="mt-1 text-[11px] text-muted-foreground">
                            {adTypesMap[(adTypeSelections[a.id] ?? a.type ?? "image") as "image" | "id" | "script"]}
                          </div>
                        </td>
                        <td className="p-2">
                          <select
                            className="rounded-md border bg-card p-2 text-sm"
                            defaultValue={a.placement ?? a.position ?? "header"}
                            onChange={(e) => setPlacementSelections((prev) => ({ ...prev, [a.id]: (e.target.value as "header" | "sidebar" | "inline") ?? "header" }))}
                          >
                            <option value="header">Header</option>
                            <option value="sidebar">Sidebar</option>
                            <option value="inline">Inline</option>
                          </select>
                          <div className="mt-1 text-[11px] text-muted-foreground">
                            {placementMap[(placementSelections[a.id] ?? a.placement ?? "header") as "header" | "sidebar" | "inline"]}
                          </div>
                        </td>
                        <td className="p-2">
                          {(adTypeSelections[a.id] ?? a.type ?? "image") === "image" && (
                            <input name="ad_image_url" data-id={a.id} defaultValue={a.image_url ?? ""} className="w-full rounded-md border bg-card p-2 text-sm" />
                          )}
                        </td>
                        <td className="p-2">
                          {(adTypeSelections[a.id] ?? a.type ?? "image") === "image" && (
                            <input name="ad_link_url" data-id={a.id} defaultValue={a.link_url ?? ""} className="w-full rounded-md border bg-card p-2 text-sm" />
                          )}
                        </td>
                        <td className="p-2">
                          {(adTypeSelections[a.id] ?? a.type ?? "image") === "id" && (
                            <input name="ad_ad_id" data-id={a.id} defaultValue={a.ad_id ?? ""} className="w-full rounded-md border bg-card p-2 text-sm" />
                          )}
                        </td>
                        <td className="p-2">
                          {(adTypeSelections[a.id] ?? a.type ?? "image") === "script" && (
                            <textarea name="ad_script" data-id={a.id} defaultValue={a.ad_script ?? ""} className="w-full rounded-md border bg-card p-2 text-sm" rows={3} />
                          )}
                        </td>
                        <td className="p-2">
                          <input type="checkbox" name="ad_active" data-id={a.id} defaultChecked={!!a.active} />
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                              onClick={(e) => {
                                e.preventDefault();
                                handleSaveAd(a.id);
                              }}
                            >
                              حفظ
                            </button>
                            <button
                              type="button"
                              className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                              onClick={() => {
                                (async () => {
                                  const { error } = await supabase.from("ads").delete().eq("ad_id", a.id);
                                  if (!error) {
                                    setAds((prev) => prev.filter((x) => x.id !== a.id));
                                    setStatus("تم حذف الإعلان");
                                  } else {
                                    setStatus(error.message || "تعذر حذف الإعلان");
                                  }
                                })().catch(() => setStatus("تعذر حذف الإعلان"));
                              }}
                            >
                              حذف
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          {status && <p className="mt-3 text-sm text-muted-foreground">{status}</p>}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
