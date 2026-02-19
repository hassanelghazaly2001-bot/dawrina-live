try {
  const path = (() => {
    try {
      return window.location.pathname || "";
    } catch {
      return "";
    }
  })();
  if (!path.startsWith("/match") || path.includes("/admin")) {
    // Only run on Match Details pages; skip Admin or other routes
    throw new Error("Skip share modal on this route");
  }
  function init() {
    const shareBtn = document.getElementById("share-btn");
    const shareDialog = document.getElementById("share-modal");
    const closeBtn = document.getElementById("share-close");

    if (shareBtn) {
      shareBtn.addEventListener("click", async (e) => {
        try {
          e.preventDefault();
          e.stopPropagation();
          const url = window.location.href;
          const title = document.title || "شارك";
          if (navigator.share) {
            await navigator.share({ title, url }).catch(() => {});
            return;
          }
          if (shareDialog) {
            shareDialog.classList.remove("hidden");
          }
        } catch {
          void 0;
        }
      });
    }

    if (closeBtn && shareDialog) {
      closeBtn.addEventListener("click", (e) => {
        try {
          e.preventDefault();
          e.stopPropagation();
          shareDialog.classList.add("hidden");
        } catch {
          void 0;
        }
      });
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
} catch {
  void 0;
}
