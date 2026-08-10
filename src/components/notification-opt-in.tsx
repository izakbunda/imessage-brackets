"use client";

import { useEffect, useState } from "react";
import { savePushSubscription } from "@/app/room/[code]/push-actions";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function NotificationOptIn({ token }: { token: string }) {
  const [status, setStatus] = useState<"checking" | "unsupported" | "off" | "on" | "denied">(
    "checking"
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }
    navigator.serviceWorker.ready.then(async (registration) => {
      const existing = await registration.pushManager.getSubscription();
      setStatus(existing ? "on" : "off");
    });
  }, []);

  async function enable() {
    setError(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "off");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ) as BufferSource,
      });

      await savePushSubscription(token, subscription.toJSON() as {
        endpoint: string;
        keys: { p256dh: string; auth: string };
      });
      setStatus("on");
    } catch {
      setError("Couldn't enable notifications, try again.");
    }
  }

  if (status === "checking" || status === "unsupported" || status === "on") return null;

  return (
    <div className="border rounded-md p-3 flex flex-col gap-2 text-sm">
      {status === "denied" ? (
        <p className="text-neutral-500">
          Notifications are blocked for this app — enable them in your phone&apos;s settings to
          get match alerts.
        </p>
      ) : (
        <>
          <p>Turn on notifications to know when your match is live.</p>
          <button
            type="button"
            onClick={enable}
            className="bg-blue-500 text-white rounded-md px-3 py-1.5 font-medium self-start"
          >
            Enable notifications
          </button>
        </>
      )}
      {error && <p className="text-red-600">{error}</p>}
    </div>
  );
}
