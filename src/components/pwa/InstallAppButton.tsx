import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export const InstallAppButton = ({
  variant = "floating",
  className = "",
}: {
  variant?: "floating" | "inline";
  className?: string;
}) => {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOSGuide, setIsIOSGuide] = useState(false);
  const isMobile = typeof navigator !== "undefined" && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  useEffect(() => {
    function handler(e: Event) {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function isIOS(): boolean {
    const ua = navigator.userAgent;
    return /iPad|iPhone|iPod/.test(ua);
  }

  async function onClick() {
    if (isIOS()) {
      setIsIOSGuide(true);
      return;
    }
    if (deferred) {
      try {
        await deferred.prompt();
        await deferred.userChoice;
        setDeferred(null);
      } catch {
        setDeferred(null);
      }
    }
  }

  if (!isMobile) return null;
  if (variant === "inline") {
    return (
      <div className={["sm:hidden mt-2 flex items-center justify-center", className].join(" ")}>
        <button
          type="button"
          onClick={onClick}
          className="inline-flex items-center rounded-full border border-amber-400 bg-black/40 px-3 py-1 text-xs font-bold text-amber-200 hover:bg-black/60"
        >
          حمل التطبيق
        </button>
        {isIOSGuide && (
          <div className="ml-2 rounded-md border border-border bg-card/80 px-2 py-1 text-[11px] text-muted-foreground shadow-lg">
            iOS: مشاركة → أضف للشاشة الرئيسية
          </div>
        )}
      </div>
    );
  }
  return (
    <div className="absolute left-3 top-3 sm:hidden">
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center rounded-full border border-yellow-400 bg-black/40 px-3 py-1 text-xs font-bold text-yellow-300 shadow-[0_0_10px_rgba(255,215,0,0.6)] hover:bg-black/60"
      >
        حمل التطبيق
        <span className="ml-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-yellow-300" aria-hidden />
      </button>
      {isIOSGuide && (
        <div className="mt-2 w-56 rounded-md border border-border bg-card/80 p-2 text-[11px] text-muted-foreground shadow-lg">
          1) انقر مشاركة • 2) أضف إلى الشاشة الرئيسية
        </div>
      )}
    </div>
  );
};
