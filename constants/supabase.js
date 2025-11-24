import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

const SUPABASE_URL = "https://ljnvptzkfjnvmmnupirp.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqbnZwdHprZmpudm1tbnVwaXJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxOTY0NDAsImV4cCI6MjA2MTc3MjQ0MH0.cXqf60krI8LsxvmLQdh7cLam8dSzTAsKId0nCPTqFgE";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  realtime: {
    websocket: false,
  },
});
