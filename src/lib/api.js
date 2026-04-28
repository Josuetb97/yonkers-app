import { supabase } from "./supabase";

export async function apiFetch(url, options = {}) {

  const { data:{session} } = await supabase.auth.getSession();

  if(!session){
    throw new Error("No session");
  }

  const token = session.access_token;

  return fetch(url,{
    ...options,
    headers:{
      ...(options.headers || {}),
      Authorization:`Bearer ${token}`
    }
  });

}