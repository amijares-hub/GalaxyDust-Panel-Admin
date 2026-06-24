import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

// ============================================================
//  CORS
// ============================================================
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ResolvePayload {
  expeditionId: string;
}

function errorResponse(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });
}

// Utilidad para detectar si se ha equipado un Quantum Miniaturizer Platform
function hasQMP(tools: any[], astrobots: any[]): boolean {
  const allEquipment = [...(tools || []), ...(astrobots || [])];
  return allEquipment.some(item => item?.id === 'exp_qmp_platform');
}

// ============================================================
//  EDGE FUNCTION — resolve-expedition
//  Arbitro puro de matemáticas RNG y lógica de conquista/minería
// ============================================================
serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return errorResponse("Token de comandante no válido.", 401);
    }

    const payload: ResolvePayload = await req.json();
    if (!payload.expeditionId) {
      return errorResponse("El payload debe incluir 'expeditionId'.", 400);
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // ──────────────────────────────────────────────────────
    // 1. Extracción de Contexto
    // ──────────────────────────────────────────────────────
    const { data: expedition, error: expError } = await serviceClient
      .from("expeditions")
      .select("*")
      .eq("id", payload.expeditionId)
      .single();

    if (expError || !expedition) {
      return errorResponse("Expedición no encontrada en registros de vuelo.", 404);
    }

    if (expedition.status === "finished") {
      return errorResponse("Rechazado: La expedición ya fue resuelta anteriormente.", 400);
    }

    const { data: starNode, error: starError } = await serviceClient
      .from("star_nodes")
      .select("*")
      .eq("id", expedition.target_node_id)
      .single();

    if (starError || !starNode) {
      return errorResponse("Error crítico: Nodo estelar objetivo no existe en el universo.", 404);
    }

    const attackerId = expedition.user_id;
    const defenderId = starNode.owner_id;
    
    let winnerId = null;
    let resourcesStolen = 0;
    let attackerLosses = 0;
    let defenderLosses = 0;
    let qmpBurned = 0;

    // Lógica de Ramificación
    if (!defenderId) {
       // Sin dueño actual: Colonización / Conquista libre sin combate
       winnerId = attackerId;
       
       await serviceClient
         .from("star_nodes")
         .update({ owner_id: attackerId })
         .eq("id", starNode.id);
         
    } else if (attackerId === defenderId) {
       // El comandante es dueño de la estrella: Misión de Minería pacífica
       winnerId = attackerId;
       // (Aquí iría la lógica de recolección de minería)
    } else {
      // ──────────────────────────────────────────────────────
      // 2. Simulación del Sistema de Combate (Domination)
      // ──────────────────────────────────────────────────────
      // ATACANTE: Sumatoria de poder basada en la flota enviada
      const attackerPower = (expedition.fleet_payload || []).reduce((acc: number, ship: any) => acc + (ship.qty || 1), 0);
      
      // DEFENSOR: (Mock de poder defensivo, asumiendo RNG si no hay tabla estricta de defensas estacionadas)
      const defenderPower = Math.floor(Math.random() * 5) + 1; 

      // Determinación RNG balanceada
      const totalPower = attackerPower + defenderPower;
      const attackerWinChance = attackerPower / (totalPower || 1);
      const attackerWins = Math.random() < attackerWinChance;

      const attackerHasQMP = hasQMP(expedition.equipped_tools, expedition.equipped_astrobots);
      // Supongamos un 30% base de probabilidad de que el defensor tenga plataformas QMP locales
      const defenderHasQMP = Math.random() < 0.3; 

      if (attackerWins) {
        // ──────────────────────────────────────────────────────
        // 3. Rama A: ATACANTE GANA (Conquista Exitosa)
        // ──────────────────────────────────────────────────────
        winnerId = attackerId;
        
        // El atacante roba el 25% de los recursos acumulados por el defensor
        const accumulated = Number(starNode.accumulated_resources || 0);
        resourcesStolen = Math.floor(accumulated * 0.25);
        
        // Rama C: DEFENSOR PIERDE
        // El defensor pierde toda su producción acumulada (se resetea a 0)
        await serviceClient
          .from("star_nodes")
          .update({ 
            owner_id: attackerId,
            accumulated_resources: 0
          })
          .eq("id", starNode.id);

        // Mecánica de Captura QMP
        defenderLosses = Math.floor(Math.random() * 3) + 1; // 1 a 3 naves enemigas perdidas
        if (attackerHasQMP) {
          qmpBurned = 1; 
          // (Las naves se agregan al atacante. Lógica de inserción de inventario pendiente)
        } else {
          // Sin QMP, las naves enemigas simplemente se destruyen en el vacío
        }

      } else {
        // ──────────────────────────────────────────────────────
        // 4. Rama B: DEFENSOR GANA (Defensa Exitosa)
        // ──────────────────────────────────────────────────────
        winnerId = defenderId;

        // El dueño retiene la estrella y obtiene Boost de Producción (100% por 1 Hora)
        const boostUntil = new Date(Date.now() + 60 * 60 * 1000).toISOString();
        
        await serviceClient
          .from("star_nodes")
          .update({
            production_boost_until: boostUntil
          })
          .eq("id", starNode.id);

        // Mecánica de Captura QMP del Defensor
        attackerLosses = Math.floor(Math.random() * 3) + 1; // 1 a 3 naves del atacante perdidas
        if (defenderHasQMP) {
           qmpBurned = 1; 
           // (Las naves se agregan al defensor. Lógica de inserción de inventario pendiente)
        }
      }
    }

    // ──────────────────────────────────────────────────────
    // 6. Persistencia e Historial (Logs)
    // ──────────────────────────────────────────────────────
    
    // Sellar estado de expedición
    await serviceClient
      .from("expeditions")
      .update({ status: "finished" })
      .eq("id", expedition.id);

    // Insertar reporte analítico completo en combat_logs
    if (defenderId && attackerId !== defenderId) {
      await serviceClient
        .from("combat_logs")
        .insert({
          expedition_id: expedition.id,
          star_node_id: starNode.id,
          attacker_id: attackerId,
          defender_id: defenderId,
          winner_id: winnerId,
          resources_stolen: resourcesStolen,
          attacker_losses: { ships_lost: attackerLosses },
          defender_losses: { ships_lost: defenderLosses },
          qmp_burned: qmpBurned
        });
    }

    // Responder con el parte de guerra
    return new Response(
      JSON.stringify({
        success: true,
        report: {
          winnerId,
          resourcesStolen,
          attackerLosses,
          defenderLosses,
          qmpBurned,
          combatOccurred: defenderId && attackerId !== defenderId
        }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error interno desconocido en motor RNG.";
    console.error("[resolve-expedition] Error Crítico:", message);
    return new Response(
      JSON.stringify({ error: message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
