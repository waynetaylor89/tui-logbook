import { useEffect, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

export default function UpdateAvailableBanner() {
  const [isUpdating, setIsUpdating] = useState(false);
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;

      const checkForUpdates = () => registration.update();
      window.addEventListener("focus", checkForUpdates);
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
          checkForUpdates();
        }
      });
      setInterval(checkForUpdates, 60 * 1000);
    },
  });

  useEffect(() => {
    if (!needRefresh) return;
    setIsUpdating(false);
  }, [needRefresh]);

  const handleUpdate = async () => {
    if (isUpdating) return;
    setIsUpdating(true);

    if ("serviceWorker" in navigator) {
      const onControllerChange = () => {
        window.location.reload();
      };
      navigator.serviceWorker.addEventListener("controllerchange", onControllerChange, { once: true });
    }

    await updateServiceWorker(true);
  };

  if (!needRefresh) return null;

  return (
    <section className="ops-panel rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3 sm:p-4" aria-label="Update available">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-amber-200">Update Available</p>
          <p className="text-sm text-amber-100">A new version is ready. Update now to use the latest features.</p>
        </div>
        <button
          type="button"
          onClick={handleUpdate}
          disabled={isUpdating}
          className="min-h-11 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-75"
        >
          {isUpdating ? "Updating..." : "Update Now"}
        </button>
      </div>
    </section>
  );
}
