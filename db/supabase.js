import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
const supaBaseKey = process.env.SUPABASE_KEY;
const supaBaseUrl = process.env.SUPABASE_URL;
const jwtKey = process.env.JWT_SECRET;

async function initSupabase() {
  //token created using jwt key from supabase
  const token = jwt.sign({ role: "authenticated" }, jwtKey, {
    expiresIn: "7d",
  });
  const supabase = createClient(supaBaseUrl, supaBaseKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`, // dynamically set the JWT token
      },
    },
  });
  return supabase;
}
const supabase = await initSupabase();

export default supabase;
