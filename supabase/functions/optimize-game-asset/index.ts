import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0"

// Configuración global de cabeceras CORS para evitar bloqueos de red
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Manejo de peticiones de preflight de CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const s3Url = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!s3Url || !serviceKey) {
      throw new Error("Variables de entorno operativas de Supabase ausentes en el entorno local.");
    }

    const payload = await req.json();
    console.log("[STORAGE LOG]: Evaluando payload entrante:", JSON.stringify(payload));

    // Webhook Guard: Validamos que sea un alta estrictamente en nuestro bucket asignado
    if (payload.type !== "INSERT" || payload.record.bucket_id !== "galaxy-assets") {
      return new Response(JSON.stringify({ skipped: true, msg: "Filtro activo: No pertenece a galaxy-assets" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      });
    }

    const filePath = payload.record.name; // Estructura: "seed_ships/zeuzo_z01.png"
    const pathParts = filePath.split('/');

    if (pathParts.length < 2) {
      return new Response(JSON.stringify({ error: "Estructura de ruta de archivo inválida." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400
      });
    }

    const tableName = pathParts[0]; // Carpeta raíz coincide con el nombre de la tabla
    const fileNameWithExt = pathParts[1];
    const assetId = fileNameWithExt.split('.')[0]; // Nombre del archivo es la clave primaria

    // Mapa relacional estructurado sugerido por Antigravity
    const PRIMARY_KEY_MAP: Record<string, string> = {
      'seed_ships': 'ship_id',
      'seed_structures': 'building_id',
      'seed_defenses': 'defense_id',
      'seed_technologies': 'technology_id',
      'seed_badges': 'badge_id'
    };

    const primaryKeyColumn = PRIMARY_KEY_MAP[tableName] || 'id';
    console.log(`[PIPELINE ACTIVE]: Procesando asset [${assetId}] para la tabla "${tableName}" (PK: ${primaryKeyColumn})`);

    const supabaseAdmin = createClient(s3Url, serviceKey);

    // Renderizador optimizado WebP a través de la CDN nativa de Supabase Storage
    const publicImageUrl = `${s3Url}/storage/v1/render/image/public/galaxy-assets/${filePath}?width=512&height=512&resize=contain&format=webp&quality=80`;

    // Ejecución de la mutación persistente pasando los RLS vía service_role
    const { error: dbError } = await supabaseAdmin
      .from(tableName)
      .update({ image_url: publicImageUrl })
      .eq(primaryKeyColumn, assetId);

    if (dbError) throw dbError;

    console.log(`[ÉXITO POSTGRES]: Columna image_url actualizada en "${tableName}" para el ID [${assetId}]`);

    return new Response(JSON.stringify({ success: true, assetId, table: tableName, url: publicImageUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    });

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Ocurrió un error desconocido en el hilo de ejecución";
    console.error("[ERROR CRÍTICO DE PIPELINE]:", errorMessage);

    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500
    });
  }
})