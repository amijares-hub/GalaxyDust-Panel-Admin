import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // Requiere bypass RLS para el admin config
    )

    const payload = await req.json()
    const { action, configData } = payload

    // Insertar o actualizar la configuración global "Headless" (Game Configuration)
    if (action === 'update_global_config') {
      const { data, error } = await supabaseClient
        .from('game_configurations')
        .upsert({ id: 'latest', payload: configData })
        .select()

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, message: 'Admin state synchronized successfully', data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    throw new Error('Action no soportada por el endopoint sync-admin-state')

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
