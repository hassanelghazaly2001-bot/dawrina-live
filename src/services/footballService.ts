import type { Match } from "@/data/matches";
import { supabase } from "@/lib/supabase";

export async function fetchFixturesForLeagues(): Promise<Match[]> {
  try {
    const { data, error } = await supabase.from("matches").select("*");
    if (error || !Array.isArray(data)) return [];
    return data.map((row: { [k: string]: unknown }): Match => ({
      id: String(row.id),
      homeTeam: String((row.home_team as string | undefined) ?? ""),
      awayTeam: String((row.away_team as string | undefined) ?? ""),
      league: String((row.league as string | undefined) ?? ""),
      date: row.date ? String(row.date as string) : undefined,
      isTopMatch: Boolean((row.is_top_match as boolean | undefined) ?? false),
      time: String((row.time as string | undefined) ?? ""),
      status: (String((row.status as string | undefined) ?? "upcoming").toLowerCase() as Match["status"]),
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
  } catch {
    return [];
  }
}
