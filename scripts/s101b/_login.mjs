import { createClient } from '@supabase/supabase-js';
const s = createClient(process.env.SUPA_URL, process.env.SUPA_ANON, { auth:{persistSession:false} });
const { data, error } = await s.auth.signInWithPassword({ email: process.argv[2], password: process.argv[3] });
console.log(error ? `rojo: ${error.message}` : `verde · uid ${data.user.id}`);
