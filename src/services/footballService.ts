import type { Match } from "@/data/matches";
import { supabase } from "@/lib/supabase";

export async function fetchFixturesForLeagues(): Promise<Match[]> {
  let manual: Match[] = [];
  try {
    const rawList = window.localStorage.getItem("custom-matches");
    if (rawList) {
      const list = JSON.parse(rawList) as Match[];
      if (Array.isArray(list) && list.length > 0) {
        manual = list;
      }
    }
  } catch {
    void 0;
  }
  let remote: Match[] = [];
  try {
    const { data, error } = await supabase.from("matches").select("*");
    if (!error && Array.isArray(data)) {
      remote = data.map((row: { [k: string]: unknown }): Match => ({
        id: String(row.id),
        homeTeam: String((row.home_team as string | undefined) ?? ""),
        awayTeam: String((row.away_team as string | undefined) ?? ""),
        league: String((row.league as string | undefined) ?? ""),
        date: row.date ? String(row.date as string) : undefined,
        isTopMatch: Boolean((row.is_top_match as boolean | undefined) ?? false),
        time: String((row.time as string | undefined) ?? ""),
        status:
          (String((row.status as string | undefined) ?? "upcoming").toLowerCase() as Match["status"]) ?? "upcoming",
        streamUrl: "",
        channelSlug: (row.channel_slug as string | undefined) ? String(row.channel_slug as string) : undefined,
        backupIframe: (row.backup_iframe as string | undefined) ? String(row.backup_iframe as string) : undefined,
        playerServer: (row.player_server as string | undefined) ? (String(row.player_server as string) as "panda" | "starz") : undefined,
        homeLogo: (row.home_logo as string | undefined) ? String(row.home_logo as string) : undefined,
        awayLogo: (row.away_logo as string | undefined) ? String(row.away_logo as string) : undefined,
        tvChannel: (row.tv_channel as string | undefined) ? String(row.tv_channel as string) : undefined,
        commentator: (row.commentator as string | undefined) ? String(row.commentator as string) : undefined,
        stadium: (row.stadium as string | undefined) ? String(row.stadium as string) : undefined,
      }));
    }
  } catch {
    remote = [];
  }
  const base: Match[] = [...remote, ...manual.filter((m) => !remote.some((r) => r.id === m.id))];
  const merged: Match[] = base.map((m) => {
    const raw = window.localStorage.getItem(`match-streams:${m.id}`);
    let arr: string[] = [];
    if (raw) {
      try {
        arr = JSON.parse(raw) as string[];
      } catch {
        arr = [];
      }
    }
    const statusRaw = window.localStorage.getItem(`match-status:${m.id}`);
    const statusOverride =
      statusRaw === "live" || statusRaw === "upcoming" || statusRaw === "finished"
        ? statusRaw
        : undefined;
    let tvChannel = m.tvChannel;
    let commentator = m.commentator;
    let stadium = m.stadium;
    try {
      const metaRaw = window.localStorage.getItem(`match-meta:${m.id}`);
      if (metaRaw) {
        const obj = JSON.parse(metaRaw) as { tvChannel?: string; commentator?: string; stadium?: string };
        tvChannel = obj.tvChannel ?? tvChannel;
        commentator = obj.commentator ?? commentator;
        stadium = obj.stadium ?? stadium;
      }
    } catch {
      // ignore
    }
    return {
      ...m,
      streamUrl: arr[0] ?? m.streamUrl,
      status: statusOverride ?? m.status,
      tvChannel,
      commentator,
      stadium,
    };
  });
  return merged;
}
