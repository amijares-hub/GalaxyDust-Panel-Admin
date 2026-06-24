import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

// ============================================================
//  CORS — Obligatorio para invocaciones desde el frontend
// ============================================================
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ============================================================
//  Tipos de contrato
// ============================================================
type ExpeditionType = "exploration" | "mining" | "domination";

interface FleetUnit {
  shipId: string;
  [key: string]: unknown;
}

interface LaunchPayload {
  nodeId: string;
  expeditionType: ExpeditionType;
  durationHours: number;
  fleetPayload: FleetUnit[];
  equippedAstrobots?: unknown[];
  equippedTools?: unknown[];
}

// ============================================================
//  Helper: Respuesta de error tipada
// ============================================================
function errorResponse(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });
}

// ============================================================
//  TODO: Validar conflictos con tecnologías activas en minería
//  Si el usuario tiene expediciones de tipo 'mining' con status
//  'traveling' o 'mining_active', no debe poder desactivar ni
//  reemplazar sus tecnologías equipadas hasta que concluyan.
//  Requisito: Bloque de Minería — ver documento de diseño PDF.
//
//  async function checkActiveMiningConflicts(
//    userId: string,
//    serviceClient: SupabaseClient
//  ): Promise<boolean> {
//    const { data } = await serviceClient
//      .from("expeditions")
//      .select("id")
//      .eq("user_id", userId)
//      .in("status", ["traveling", "mining_active"])
//      .eq("expedition_type", "mining")
//      .limit(1);
//    return (data ?? []).length > 0;
//  }
// ============================================================

// ============================================================
//  EDGE FUNCTION — launch-expedition
//  Aduana única y autorizada de despegue de flotas.
// ============================================================
serve(async (req: Request) => {
  // --- Preflight CORS ---
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ──────────────────────────────────────────────────────
    //  CAPA 1 — Autenticación Perimetral
    //  Extrae el Bearer Token y valida la identidad del
    //  comandante que realiza la solicitud.
    // ──────────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return errorResponse("Token de comandante no válido.", 401);
    }

    const userToken = authHeader.replace("Bearer ", "");

    // Cliente autenticado con el token del usuario (respeta RLS)
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: `Bearer ${userToken}` } } }
    );

    const { data: authData, error: authError } = await userClient.auth.getUser();
    if (authError || !authData?.user) {
      return errorResponse("Token de comandante no válido.", 401);
    }

    const commanderId = authData.user.id;

    // Cliente con privilegios de servicio para operaciones DB (bypass RLS)
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // ──────────────────────────────────────────────────────
    //  CAPA 2 — Validación de Payload
    //  Garantiza que el contrato de entrada sea completo
    //  y semánticamente correcto antes de tocar la DB.
    // ──────────────────────────────────────────────────────
    const payload: LaunchPayload = await req.json();

    const { nodeId, expeditionType, durationHours, fleetPayload, equippedAstrobots, equippedTools } =
      payload;

    const validExpeditionTypes: ExpeditionType[] = [
      "exploration",
      "mining",
      "domination",
    ];

    if (!nodeId || typeof nodeId !== "string") {
      return errorResponse("Payload de misión incompleto: nodeId requerido.", 400);
    }

    if (!expeditionType || !validExpeditionTypes.includes(expeditionType)) {
      return errorResponse(
        "Payload de misión incompleto: expeditionType debe ser 'exploration', 'mining' o 'domination'.",
        400
      );
    }

    if (!durationHours || typeof durationHours !== "number" || durationHours <= 0) {
      return errorResponse(
        "Payload de misión incompleto: durationHours debe ser un número positivo.",
        400
      );
    }

    if (!Array.isArray(fleetPayload) || fleetPayload.length === 0) {
      return errorResponse(
        "Flota vacía. No se puede lanzar una expedición sin naves comprometidas.",
        400
      );
    }

    // ──────────────────────────────────────────────────────
    //  CAPA 3 — Verificación del Nodo Estelar
    //  Consulta star_nodes y valida que la estrella exista
    //  y haya sido descubierta por algún comandante.
    //  Esquema confirmado (Paso 1): columna 'discovered_by' (UUID).
    // ──────────────────────────────────────────────────────
    const { data: starNode, error: starError } = await serviceClient
      .from("star_nodes")
      .select("id, discovered_by")
      .eq("id", nodeId)
      .single();

    if (starError || !starNode) {
      return errorResponse("Coordenadas estelares no exploradas.", 400);
    }

    if (starNode.discovered_by === null || starNode.discovered_by === undefined) {
      return errorResponse("Coordenadas estelares no exploradas.", 400);
    }

    // ──────────────────────────────────────────────────────
    //  CAPA 4 — Reglas de Oro de Vuelo
    //  Valida restricciones de misiones activas del
    //  comandante para evitar explotación de flotas.
    // ──────────────────────────────────────────────────────

    // Obtener expediciones activas del comandante
    const { data: activeExpeditions, error: activeError } = await serviceClient
      .from("expeditions")
      .select("id, expedition_type, status")
      .eq("user_id", commanderId)
      .in("status", ["traveling", "mining_active"]);

    if (activeError) {
      console.error("[launch-expedition] Error consultando expediciones activas:", activeError.message);
      return errorResponse("Error interno al verificar estado de la flota.", 500);
    }

    const activeMiningCount = (activeExpeditions ?? []).filter(
      (e) => e.expedition_type === "mining"
    ).length;

    const activeDominationCount = (activeExpeditions ?? []).filter(
      (e) => e.expedition_type === "domination"
    ).length;

    // Límite de ejemplo: 1 misión de minería y 1 de dominación simultáneas.
    // Ajusta estos valores según el documento de diseño PDF.
    const MAX_CONCURRENT_MINING = 1;
    const MAX_CONCURRENT_DOMINATION = 1;

    if (expeditionType === "mining" && activeMiningCount >= MAX_CONCURRENT_MINING) {
      return errorResponse(
        `Límite de misiones de minería alcanzado. Máximo ${MAX_CONCURRENT_MINING} activa(s) simultánea(s).`,
        400
      );
    }

    if (expeditionType === "domination" && activeDominationCount >= MAX_CONCURRENT_DOMINATION) {
      return errorResponse(
        `Límite de misiones de dominación alcanzado. Máximo ${MAX_CONCURRENT_DOMINATION} activa(s) simultánea(s).`,
        400
      );
    }

    // TODO: Validar que el usuario no esté intentando desactivar/reemplazar
    // tecnologías si tiene minerías activas (Requisito de Minería PDF).
    // Descomentar y conectar al hook: checkActiveMiningConflicts(commanderId, serviceClient)

    // ──────────────────────────────────────────────────────
    //  CAPA 5 — Persistencia Segura (Service Role Bypass RLS)
    //  Solo se ejecuta si todas las capas anteriores pasan.
    //  El estado inicial DEBE ser 'traveling' en minúsculas
    //  para respetar el CHECK constraint de la base de datos.
    // ──────────────────────────────────────────────────────
    const arrivesAt = new Date(
      Date.now() + durationHours * 60 * 60 * 1000
    ).toISOString();

    const expeditionRecord = {
      user_id: commanderId,
      target_node_id: nodeId,        // ← Columna confirmada por migración Paso 1
      expedition_type: expeditionType,
      duration_hours: durationHours,
      fleet_payload: fleetPayload,
      equipped_astrobots: equippedAstrobots ?? [],
      equipped_tools: equippedTools ?? [],
      status: "traveling",            // ← Estrictamente minúsculas (CHECK constraint DB)
      arrives_at: arrivesAt,
    };

    const { data: newExpedition, error: insertError } = await serviceClient
      .from("expeditions")
      .insert(expeditionRecord)
      .select()
      .single();

    if (insertError) {
      console.error("[launch-expedition] Error al insertar expedición:", insertError.message);
      return errorResponse(`Error al registrar la expedición: ${insertError.message}`, 500);
    }

    // ──────────────────────────────────────────────────────
    //  RESPUESTA 200 OK — Telemetría exitosa
    // ──────────────────────────────────────────────────────
    return new Response(
      JSON.stringify({
        success: true,
        telemetry: "Expedición registrada. Flota en tránsito estelar.",
        expedition: newExpedition,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error interno desconocido.";
    console.error("[launch-expedition] Error no controlado:", message);
    return new Response(
      JSON.stringify({ error: message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
