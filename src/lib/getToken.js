import { supabase } from "./supabase";

export async function getToken(){

 const { data:{ session } } = await supabase.auth.getSession();

 if(session) return session.access_token;

 const { data } = await supabase.auth.getUser();

 if(!data?.user) return null;

 const refreshed = await supabase.auth.refreshSession();

 return refreshed.data.session?.access_token || null;

}