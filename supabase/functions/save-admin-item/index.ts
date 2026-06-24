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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const payload = await req.json()
    const { action = 'upsert', tableName, recordData, recordId, recordIds, primaryKeyCol = 'skill_code' } = payload

    if (!tableName) {
      return new Response(
        JSON.stringify({ error: "Missing tableName in payload" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    if (action === 'delete') {
      if (!recordId) throw new Error("Missing recordId for delete action");
      const { data, error } = await supabaseClient.from(tableName).delete().eq(primaryKeyCol, recordId).select();
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, message: 'Item deleted successfully', data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    }

    if (action === 'bulk_delete') {
      if (!recordIds || !Array.isArray(recordIds)) throw new Error("Missing or invalid recordIds array for bulk_delete action");
      const { data, error } = await supabaseClient.from(tableName).delete().in(primaryKeyCol, recordIds).select();
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, message: 'Items deleted successfully', data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    }

    if (action === 'upsert') {
      if (!recordData) {
        return new Response(
          JSON.stringify({ error: "Missing recordData for upsert action" }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      // 1. Validar outcome_config si existe
      if (recordData.outcome_config) {
        const config = recordData.outcome_config;
        const configType = config.config_type;

        if (configType === 'materializer_matrix') {
          const outcomes = config.outcomes || [];
          const totalChance = outcomes.reduce((sum: number, outcome: any) => sum + (outcome.chance_pct || 0), 0);
          if (totalChance !== 100) {
            return new Response(
              JSON.stringify({ error: `Validation Error: Materializer config chances must sum exactly 100. Current sum is ${totalChance}.` }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            );
          }
        } else if (configType === 'weighted_drop_table') {
          const drops = config.drops || [];
          for (let i = 0; i < drops.length; i++) {
            const drop = drops[i];
            if (drop.quantity_min > drop.quantity_max) {
              return new Response(
                JSON.stringify({ error: `Validation Error: Drop at index ${i} has quantity_min (${drop.quantity_min}) greater than quantity_max (${drop.quantity_max}).` }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
              );
            }
          }
        }
      }

      // 2. Ejecutar Upsert con bypass RLS via service_role
      const { data, error } = await supabaseClient
        .from(tableName)
        .upsert(recordData)
        .select();

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, message: 'Item saved successfully', data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    throw new Error(`Unsupported action: ${action}`);

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
