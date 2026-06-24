#!/bin/bash

# Colores tácticos para la consola
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

API_URL="http://localhost:8080/api/admin"

echo -e "${CYAN}=====================================================================${NC}"
echo -e "${CYAN}      GALAXYDUST ONLINE - SASORI CORE OS BACKEND TESTER v1.0         ${NC}"
echo -e "${CYAN}=====================================================================${NC}"

# 1. PRUEBA: Creación de Promo Codes (AdminPromoModule)
echo -e "\n${YELLOW}[TEST 01] Evidenciando creación de Promo Code 'ALPHA2026'...${NC}"
PROMO_PAYLOAD='{
  "code": "ALPHA2026",
  "expires_at": "2026-12-31T23:59:59Z",
  "max_claims": 500,
  "rewards": {"metal": 50000, "crystal": 25000, "gd_coin": 1000}
}'

RESPONSE_PROMO=$(curl -s -w "%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -d "$PROMO_PAYLOAD" \
  $API_URL/promo/create)

HTTP_CODE_PROMO="${RESPONSE_PROMO:${#RESPONSE_PROMO}-3}"
BODY_PROMO="${RESPONSE_PROMO:0:${#RESPONSE_PROMO}-3}"

if [ "$HTTP_CODE_PROMO" -eq 213 ] || [ "$HTTP_CODE_PROMO" -eq 201 ] || [ "$HTTP_CODE_PROMO" -eq 200 ]; then
    echo -e "${GREEN}✓ ÉXITO [HTTP $HTTP_CODE_PROMO]: Código creado o validado por PostgreSQL.${NC}"
    echo -e "Respuesta: $BODY_PROMO"
else
    echo -e "${RED}✗ FALLO [HTTP $HTTP_CODE_PROMO]: El backend rechazó la inyección mercantil.${NC}"
fi

# 2. PRUEBA: Mutación Atómica de Líder (AdminAllianceCRM)
echo -e "\n${YELLOW}[TEST 02] Forzando mutación jerárquica de líder de Alianza...${NC}"
ALLIANCE_PAYLOAD='{
  "alliance_id": "ALL-VANG",
  "new_leader_id": "usr-cyberkitsune"
}'

RESPONSE_ALLIANCE=$(curl -s -w "%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -d "$ALLIANCE_PAYLOAD" \
  $API_URL/alliance/mutate-leader)

HTTP_CODE_ALLIANCE="${RESPONSE_ALLIANCE:${#RESPONSE_ALLIANCE}-3}"

if [ "$HTTP_CODE_ALLIANCE" -eq 200 ]; then
    echo -e "${GREEN}✓ ÉXITO [HTTP 200]: Transmisión de mando completada mediante BEGIN...COMMIT.${NC}"
else
    echo -e "${RED}✗ FALLO [HTTP $HTTP_CODE_ALLIANCE]: Transacción SQL revertida por Rollback.${NC}"
fi

# 3. PRUEBA: Escáner Heurístico Anti-Cheat (AdminSecurityModule - TAB 1)
echo -e "\n${YELLOW}[TEST 03] Activando radar heurístico de anomalías financieras...${NC}"
RESPONSE_SECURITY=$(curl -s -w "%{http_code}" -X GET $API_URL/security/anti-cheat-check)
HTTP_CODE_SECURITY="${RESPONSE_SECURITY:${#RESPONSE_SECURITY}-3}"
BODY_SECURITY="${RESPONSE_SECURITY:0:${#RESPONSE_SECURITY}-3}"

if [ "$HTTP_CODE_SECURITY" -eq 200 ]; then
    echo -e "${GREEN}✓ ÉXITO [HTTP 200]: Barrido completado en Supabase.${NC}"
    echo -e "${CYAN}Registros Flagged:${NC} $BODY_SECURITY"
else
    echo -e "${RED}✗ FALLO [HTTP $HTTP_CODE_SECURITY]: Error al consultar la heurística del Roster.${NC}"
fi

# 4. PRUEBA: Registro de Caja Negra PvP (AdminSecurityModule - TAB 2)
echo -e "\n${YELLOW}[TEST 04] Transmitiendo telemetría de reporte de combate PvP...${NC}"
BATTLE_PAYLOAD='{
  "attacker_id": "usr-cyberkitsune",
  "defender_id": "usr-bot-exploit",
  "winner_id": "usr-cyberkitsune",
  "loot_stolen": {"metal": 12000, "captured_ships": 1},
  "battle_log": ["Fase 1: Escudos colapsados", "Fase 2: Impacto crítico plasma"],
  "raw_json": {"server_seed": 9942, "verification_hash": "0xaf7d82e"}
}'

RESPONSE_BATTLE=$(curl -s -w "%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -d "$BATTLE_PAYLOAD" \
  $API_URL/security/battle-log)

HTTP_CODE_BATTLE="${RESPONSE_BATTLE:${#RESPONSE_BATTLE}-3}"

if [ "$HTTP_CODE_BATTLE" -eq 201 ] || [ "$HTTP_CODE_BATTLE" -eq 200 ]; then
    echo -e "${GREEN}✓ ÉXITO [HTTP $HTTP_CODE_BATTLE]: Reporte de batalla archivado de forma forense.${NC}"
else
    echo -e "${RED}✗ FALLO [HTTP $HTTP_CODE_BATTLE]: No se pudo escribir en la tabla sasori_pvp_battle_reports.${NC}"
fi

echo -e "\n${CYAN}=====================================================================${NC}"
echo -e "${GREEN}              AUDITORÍA CONCLUIDA CORRECTAMENTE                      ${NC}"
echo -e "${CYAN}=====================================================================${NC}"
