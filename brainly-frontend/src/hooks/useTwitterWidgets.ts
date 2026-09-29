import { useEffect } from "react";

let loaded = false;

/** Injects the Twitter/X widgets script once per app session (embeds render via its DOM observer). */
export function useTwitterWidgets() {
  useEffect(() => {
    if (loaded) return;
    loaded = true;
    const script = document.createElement("script");
    script.src = "https://platform.twitter.com/widgets.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);
}
