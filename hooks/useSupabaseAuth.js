import { useEffect } from "react";
import { supabase } from "../constants/supabase";

export function useSupabaseAuth() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash;
      if (hash.includes("access_token")) {
        const params = Object.fromEntries(
          new URLSearchParams(hash.substring(1))
        );
        supabase.auth
          .setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token,
          })
          .then(() => {
            // limpiar la URL
            window.history.replaceState({}, document.title, "/");
          });
      }
    }
  }, []);
}
