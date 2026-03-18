import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

const SUPABASE_URL = "https://aponfmkmaivqazbsumjm.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwb25mbWttYWl2cWF6YnN1bWptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMzQxOTAsImV4cCI6MjA4ODgxMDE5MH0.futQMlYYfMGn0uGsbxdTmYVFLy8TVkY_ArYzFg6bJ60";

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
