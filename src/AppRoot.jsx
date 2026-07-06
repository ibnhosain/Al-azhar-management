import { useState, useEffect } from "react";
import App from "./App.jsx";
import FirstRunSetup from "./modules/settings/FirstRunSetup";
import { backup, environment } from "./data";

// অ্যাপের প্রবেশদ্বার: Electron-এ প্রথম রানে সেটআপ স্ক্রিন, নাহলে মূল অ্যাপ।
// Web সংস্করণে সেটআপ নেই — সরাসরি অ্যাপ।
export default function AppRoot() {
  const [phase, setPhase] = useState(environment === "web" ? "app" : "loading");

  useEffect(() => {
    if (environment === "web") return;
    let alive = true;
    (async () => {
      try {
        const info = await backup.info();
        if (alive) setPhase(info && info.setupComplete ? "app" : "setup");
      } catch {
        if (alive) setPhase("app"); // তথ্য না পেলে অ্যাপ দেখাই
      }
    })();
    return () => { alive = false; };
  }, []);

  if (phase === "loading") return null;
  if (phase === "setup") return <FirstRunSetup onDone={() => setPhase("app")} />;
  return <App />;
}
