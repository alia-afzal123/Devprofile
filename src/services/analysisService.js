import { supabase } from "../lib/supabase";

export async function saveAnalysis({
  type,
  score,
  input,
  result,
  status = "completed",
}) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("No logged-in user found.");
  }

  const { data, error } = await supabase
    .from("analyses")
    .insert([
      {
        user_id: user.id,
        type,
        status,
        score,
        input,
        result,
      },
    ])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}