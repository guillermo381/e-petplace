import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: corsHeaders,
    })
  }

  const { email, nombre, telefono } = await req.json()

  if (!email || !nombre) {
    return new Response(JSON.stringify({ error: 'email y nombre son obligatorios' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )

  // Verificar si el user ya existe
  const { data: existingUsers, error: lookupError } = await supabaseAdmin
    .from('profiles')
    .select('id, email, nombre, telefono')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle()

  if (lookupError) {
    return new Response(JSON.stringify({ error: lookupError.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (existingUsers) {
    // Existe — devolver el user_id sin tocar nada
    return new Response(
      JSON.stringify({
        user_id: existingUsers.id,
        existe:  true,
        email:   existingUsers.email,
        nombre:  existingUsers.nombre,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  // No existe — crear con clave random
  const passwordTemporal = crypto.randomUUID()

  const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: email.toLowerCase().trim(),
    password: passwordTemporal,
    email_confirm: true,
    user_metadata: {
      full_name: nombre,
      created_by_walkin: true,
    },
  })

  if (createError || !newUser?.user) {
    return new Response(JSON.stringify({
      error: createError?.message ?? 'Error creando user'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const userId = newUser.user.id

  // Asegurar profile (puede haberse creado vía trigger, pero por si acaso)
  await supabaseAdmin
    .from('profiles')
    .upsert({
      id:       userId,
      email:    email.toLowerCase().trim(),
      nombre,
      telefono: telefono ?? null,
    })

  // Asegurar role pet_parent
  await supabaseAdmin
    .from('user_roles')
    .upsert(
      { user_id: userId, role: 'pet_parent', is_active: true, country_code: 'EC' },
      { onConflict: 'user_id,role,country_code' },
    )

  return new Response(
    JSON.stringify({
      user_id: userId,
      existe:  false,
      email,
      nombre,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  )
})
