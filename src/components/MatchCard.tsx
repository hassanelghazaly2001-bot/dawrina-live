import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import type { Match } from "@/data/matches";
import { getTeamInitials } from "@/data/matches";
import { t } from "@/lib/i18n";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell } from "lucide-react";

interface MatchCardProps {
  match: Match;
}

// Minimal card: reactions and voting removed

export function MatchCard({ match }: MatchCardProps) {
  function adjustedTimeStr(raw: string): string {
    const parts = raw?.split(":") ?? [];
    const h = Number.parseInt(parts[0] ?? "", 10);
    const m = Number.parseInt(parts[1] ?? "", 10);
    if (Number.isNaN(h) || Number.isNaN(m)) return raw;
    const d = new Date();
    d.setHours(h, m, 0, 0);
    d.setHours(d.getHours() - 3);
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }
  const isLive = match.status === "live";
  const hasScore = match.score !== undefined;
  const isUpcoming = match.status === "upcoming";
  const sourceBadge = useMemo(() => {
    const slug = (match.channelSlug ?? "").toLowerCase();
    if (slug.startsWith("ssc-")) return "SSC";
    if (slug.startsWith("bein-")) return "beIN";
    return null;
  }, [match.channelSlug]);

  const [isExpanded, setIsExpanded] = useState(false);

  const clickAudioRef = useRef<HTMLAudioElement | null>(null);

  // engagement removed

  function handleCardClick() {
    if (clickAudioRef.current) {
      // Fire and forget; ignore play errors from autoplay restrictions
      void clickAudioRef.current.play().catch(() => {});
    }
    setIsExpanded((prev) => !prev);
  }

  // removed

  // removed

  async function handleRemindMeClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    if (!("Notification" in window)) {
      // eslint-disable-next-line no-alert
      alert("المتصفح لا يدعم إشعارات المتصفح في هذه اللحظة.");
      return;
    }

    if (Notification.permission === "granted") {
      // eslint-disable-next-line no-new
      new Notification("تم تفعيل التذكير بالمباراة", {
        body: `${match.homeTeam} vs ${match.awayTeam} - ${match.time}`,
      });
      return;
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        // eslint-disable-next-line no-new
        new Notification("تم تفعيل التذكير بالمباراة", {
          body: `${match.homeTeam} vs ${match.awayTeam} - ${match.time}`,
        });
      }
    }
  }

  useEffect(() => {
    let timer: number | undefined;
    (async () => {
      const { data } = await supabase
        .from("engagement")
        .select("votes_home,votes_draw,votes_away,react_fire,react_clap,react_wow")
        .eq("match_id", match.id)
        .single();
      if (data) {
        setVoteCounts({
          home: (data as { votes_home?: number }).votes_home ?? 0,
          draw: (data as { votes_draw?: number }).votes_draw ?? 0,
          away: (data as { votes_away?: number }).votes_away ?? 0,
        });
        setReactionCounts({
          fire: (data as { react_fire?: number }).react_fire ?? 0,
          clap: (data as { react_clap?: number }).react_clap ?? 0,
          wow: (data as { react_wow?: number }).react_wow ?? 0,
        });
      } else {
        const baseVotes = Math.floor(Math.random() * (15000 - 5000 + 1)) + 5000;
        const pHomeBase = 0.55;
        const pAwayBase = 0.30;
        const pDrawBase = 0.15;
        const jitter = () => (Math.random() - 0.5) * 0.06;
        let wHome = pHomeBase + jitter();
        let wAway = pAwayBase + jitter();
        let wDraw = pDrawBase + jitter();
        const sum = wHome + wAway + wDraw;
        wHome /= sum; wAway /= sum; wDraw /= sum;
        const vHome = Math.max(0, Math.round(baseVotes * wHome));
        const vAway = Math.max(0, Math.round(baseVotes * wAway));
        const vDraw = Math.max(0, baseVotes - vHome - vAway);
        const rFire = Math.floor(Math.random() * (1600 - 800 + 1)) + 800;
        const rClap = Math.floor(Math.random() * (1000 - 500 + 1)) + 500;
        const rWow = Math.floor(Math.random() * (700 - 300 + 1)) + 300;
        setVoteCounts({ home: vHome, draw: vDraw, away: vAway });
        setReactionCounts({ fire: rFire, clap: rClap, wow: rWow });
        await supabase
          .from("engagement")
          .upsert({
            match_id: match.id,
            votes_home: vHome,
            votes_draw: vDraw,
            votes_away: vAway,
            react_fire: rFire,
            react_clap: rClap,
            react_wow: rWow,
          })
          .eq("match_id", match.id);
      }
      const lsVote = window.localStorage.getItem(`eng:${match.id}:vote`);
      const lsReaction = window.localStorage.getItem(`eng:${match.id}:reaction`);
      if (lsVote) setSelectedVote(lsVote as VoteOption);
      if (lsReaction) setSelectedReaction(lsReaction as ReactionType);
      const delay = 30000 + Math.floor(Math.random() * 30000);
      timer = window.setInterval(() => {
        const incVotes = Math.floor(Math.random() * 3) + 1;
        const incReact = Math.floor(Math.random() * 3) + 1;
        const pickVote = ["home", "draw", "away"][Math.floor(Math.random() * 3)] as VoteOption;
        const pickReact = ["fire", "clap", "wow"][Math.floor(Math.random() * 3)] as ReactionType;
        setVoteCounts((prev) => {
          const next = { ...prev, [pickVote]: prev[pickVote] + incVotes };
          void supabase
            .from("engagement")
            .update({ votes_home: next.home, votes_draw: next.draw, votes_away: next.away })
            .eq("match_id", match.id);
          return next;
        });
        setReactionCounts((prev) => {
          const next = { ...prev, [pickReact]: prev[pickReact] + incReact };
          void supabase
            .from("engagement")
            .update({ react_fire: next.fire, react_clap: next.clap, react_wow: next.wow })
            .eq("match_id", match.id);
          return next;
        });
      }, delay);
    })().catch(() => void 0);
    return () => {
      if (timer) window.clearInterval(timer);
    };
  }, [match.id]);

  return (
    <motion.div
      layout
      whileTap={{ scale: 0.97 }}
      onClick={handleCardClick}
      className="group cursor-pointer select-none"
    >
      <audio
        ref={clickAudioRef}
        src="data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA="
        preload="auto"
      />
      <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-3 shadow-lg backdrop-blur-md transition-[transform,border-color,box-shadow,background-color] duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:border-white/30 group-hover:bg-white/[0.09] group-hover:shadow-2xl group-hover:shadow-black/40 sm:p-4">
        {/* Status badge */}
        <div className="absolute end-4 top-4">
          {isLive ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-600/95 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-white shadow-[0_0_12px_rgba(248,113,113,0.9),0_0_24px_rgba(248,113,113,0.7)]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-300 shadow-[0_0_10px_rgba(248,113,113,0.9)]" />
              {t.live}
            </span>
          ) : isUpcoming ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-600/90 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-amber-50 shadow-[0_0_12px_rgba(245,158,11,0.5)]">
              قريباً
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              انتهت
            </span>
          )}
        </div>
        {sourceBadge && (
          <div className="absolute start-4 top-4">
            <span className="inline-flex items-center rounded-full bg-black/50 px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-[0.12em] text-white">
              {sourceBadge}
            </span>
          </div>
        )}

        {/* Compact header: 3-column symmetric layout (home - center - away) */}
        <div className="flex items-center justify-between gap-3" dir="ltr">
          {/* Home team (left column, right-aligned) */}
          <div className="flex min-w-0 flex-1 flex-row-reverse items-center gap-2">
            <Avatar className="h-9 w-9 shrink-0 rounded-xl border border-border bg-muted">
              <AvatarImage src={match.homeLogo} alt={match.homeTeam} />
              <AvatarFallback className="rounded-xl bg-primary/15 text-[0.65rem] font-bold text-primary">
                {getTeamInitials(match.homeTeam)}
              </AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col items-end text-right">
              <span className="max-w-[8rem] truncate text-[0.8rem] font-semibold text-foreground sm:max-w-[10rem]">
                {match.homeTeam}
              </span>
            </div>
          </div>

          {/* Center time/score box with fixed width for symmetry */}
          <div className="flex w-28 shrink-0 flex-col items-center justify-center gap-1 rounded-lg bg-black/25 px-2 py-1.5 sm:w-32">
            <div className="tabular-nums text-sm font-semibold text-foreground">{adjustedTimeStr(match.time)}</div>
            <span className="text-[0.6rem] text-muted-foreground">GMT</span>
          </div>

          {/* Away team (right column, left-aligned) */}
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Avatar className="h-9 w-9 shrink-0 rounded-xl border border-border bg-muted">
              <AvatarImage src={match.awayLogo} alt={match.awayTeam} />
              <AvatarFallback className="rounded-xl bg-primary/15 text-[0.65rem] font-bold text-primary">
                {getTeamInitials(match.awayTeam)}
              </AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col items-start text-left">
              <span className="max-w-[8rem] truncate text-[0.8rem] font-semibold text-foreground sm:max-w-[10rem]">
                {match.awayTeam}
              </span>
            </div>
          </div>

          {/* Small remind-me bell floating over top-right to keep symmetry */}
          {isUpcoming && (
            <motion.button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                void handleRemindMeClick(event);
              }}
              className="absolute start-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full border border-amber-400/70 bg-amber-500/20 text-amber-100 shadow-sm"
              animate={{ rotate: [0, -12, 12, 0] }}
              transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
            >
              <Bell className="h-3.5 w-3.5" />
            </motion.button>
          )}
        </div>

        {isLive && (
          <div className="mt-2 flex items-center justify-end">
            <span className="inline-flex items-center gap-1 rounded-full bg-red-600/90 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-white shadow-[0_0_12px_rgba(248,113,113,0.9),0_0_24px_rgba(248,113,113,0.7)]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-300 shadow-[0_0_10px_rgba(248,113,113,0.9)]" />
              Live
            </span>
          </div>
        )}

        {/* Details removed for minimal experience */}
      </div>
    </motion.div>
  );
}
