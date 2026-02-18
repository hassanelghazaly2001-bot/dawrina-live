import type { Match } from "@/data/matches";
import { supabase } from "@/lib/supabase";

export async function fetchFixturesForLeagues(): Promise<Match[]> {
  try {
    const { data, error } = await supabase.from("matches").select("*").eq("active", true);
    if (error || !Array.isArray(data)) return [];
    return data.map((row: { [k: string]: unknown }): Match => ({
      id: String(row.id),
      homeTeam: String((row.home_team as string | undefined) ?? ""),
      awayTeam: String((row.away_team as string | undefined) ?? ""),
      league: String((row.league as string | undefined) ?? ""),
      leagueIcon: undefined,
      date: row.date ? String(row.date as string) : undefined,
      isTopMatch: Boolean((row.is_top_match as boolean | undefined) ?? false),
      time: String((row.time as string | undefined) ?? ""),
      status: (String((row.status as string | undefined) ?? "upcoming").toLowerCase() as Match["status"]),
      streamUrl: (row.stream_server_1 as string | undefined) ? String(row.stream_server_1 as string) : "",
      channelSlug: (row.channel as string | undefined) ? String(row.channel as string) : undefined,
      backupIframe: undefined,
      playerServer: undefined,
      homeLogo: (row.logo_home as string | undefined) ? String(row.logo_home as string) : undefined,
      awayLogo: (row.logo_away as string | undefined) ? String(row.logo_away as string) : undefined,
      tvChannel: undefined,
      commentator: (row.commentator as string | undefined) ? String(row.commentator as string) : undefined,
      stadium: undefined,
    }));
  } catch {
    return [];
  }
}
