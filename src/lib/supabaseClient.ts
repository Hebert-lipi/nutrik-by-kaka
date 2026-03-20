import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://yabrbvamxgvfyfqfndiv.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Yp0mhnNQsEejrGJjRHc4aA_MaSU_XGv";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

