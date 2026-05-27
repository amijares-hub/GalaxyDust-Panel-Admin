import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PVPPayload {
  attackerPower: number;
  defenderPower: number;
  riskTier: 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'LETHAL';
  baseShipLossRate: number; // e.g. 5%
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload: PVPPayload = await req.json()
    const { attackerPower, defenderPower, riskTier, baseShipLossRate } = payload

    // 1. Resolver el ganador del conflicto (simplificado: mayor poder táctico gana + RNG)
    const rng = Math.random() * 0.2 - 0.1; // +/- 10% RNG swing
    const finalAttackerScore = attackerPower * (1 + rng);
    const finalDefenderScore = defenderPower * (1 - rng);
    
    const isAttackerWinner = finalAttackerScore > finalDefenderScore;
    
    // 2. Calcular pérdidas según Tier de Riesgo
    let shipLossProbability = baseShipLossRate;
    if (riskTier === 'SAFE') shipLossProbability = 0;
    if (riskTier === 'LETHAL') shipLossProbability = Math.min(100, baseShipLossRate * 3);

    // Tirada de destrucción de nave para el perdedor
    const lostShip = (Math.random() * 100) <= shipLossProbability;

    const result = {
      winner: isAttackerWinner ? 'ATTACKER' : 'DEFENDER',
      tacticalScores: {
        attacker: Math.round(finalAttackerScore),
        defender: Math.round(finalDefenderScore)
      },
      casualties: {
        loserLostShip: lostShip,
        probabilityRolled: shipLossProbability
      }
    };

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
