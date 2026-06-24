package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/lib/pq" // Driver oficial corregido sin guion bajo para soportar pq.Array
)

// Estructuras de datos estrictas emparejadas con el esquema PostgreSQL
type PromoCodePayload struct {
	Code      string          `json:"code"`
	ExpiresAt string          `json:"expires_at"`
	MaxClaims int             `json:"max_claims"`
	Rewards   json.RawMessage `json:"rewards"`
}

type MutateLeaderPayload struct {
	AllianceID  string `json:"alliance_id"`
	NewLeaderID string `json:"new_leader_id"`
}

type CombatReportPayload struct {
	AttackerID string          `json:"attacker_id"`
	DefenderID string          `json:"defender_id"`
	WinnerID   string          `json:"winner_id"`
	LootStolen json.RawMessage `json:"loot_stolen"`
	BattleLog  []string        `json:"battle_log"`
	RawJSON    json.RawMessage `json:"raw_json"`
}

type DBHandler struct {
	DB *sql.DB
}

func main() {
	// Cadena de conexión limpia corregida sin corchetes basada en tu entorno real
	connStr := "postgres://postgres:32311995Arsoulss!!@db.qldjeysusithpblfrmtq.supabase.co:5432/postgres?sslmode=require"

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Fatalf("Fallo crítico de Handshake con Supabase: %v", err)
	}
	defer db.Close()

	h := &DBHandler{DB: db}

	// --- ENRUTADOR UNIFICADO DE LA API ADMINISTRATIVA ---
	http.HandleFunc("/api/admin/promo/create", h.HandleCreatePromoCode)
	http.HandleFunc("/api/admin/alliance/mutate-leader", h.HandleMutateAllianceLeader)
	http.HandleFunc("/api/admin/security/anti-cheat-check", h.HandleAntiCheatHeuristic)
	http.HandleFunc("/api/admin/security/battle-log", h.HandleInjectBattleReport)

	fmt.Println("🚀 [SASORI BACKEND GO] Servidor militar escuchando en puerto :8080...")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

// =========================================================================
// 1) MANEJADOR: CREACIÓN DE PROMO CODES (AdminPromoModule)
// =========================================================================
func (h *DBHandler) HandleCreatePromoCode(w http.ResponseWriter, r *http.Request) {
	// Configuración de encabezados CORS
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodPost {
		http.Error(w, "Método HTTP no permitido", http.StatusMethodNotAllowed)
		return
	}

	var p PromoCodePayload
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		http.Error(w, "JSON Payload corrupto", http.StatusBadRequest)
		return
	}

	query := `INSERT INTO sasori_promo_codes (code, expires_at, max_claims, rewards) 
	          VALUES ($1, $2, $3, $4) ON CONFLICT (code) DO NOTHING;`

	_, err := h.DB.Exec(query, p.Code, p.ExpiresAt, p.MaxClaims, p.Rewards)
	if err != nil {
		log.Printf("ERROR EN ENDPOINT: %v", err)
		http.Error(w, "Error de escritura en Supabase: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	w.Write([]byte(`{"success": true, "message": "[PROMO_CODE_CREATED] Hash persistido con éxito."}`))
}

// =========================================================================
// 2) MANEJADOR: MUTACIÓN DE LÍDER DE CLAN (AdminAllianceCRM)
// =========================================================================
func (h *DBHandler) HandleMutateAllianceLeader(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodPost {
		http.Error(w, "Método HTTP no permitido", http.StatusMethodNotAllowed)
		return
	}

	var p MutateLeaderPayload
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		http.Error(w, "JSON Payload corrupto", http.StatusBadRequest)
		return
	}

	tx, err := h.DB.Begin()
	if err != nil {
		log.Printf("ERROR EN ENDPOINT: %v", err)
		http.Error(w, "Fallo al abrir transacción SQL", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	_, err = tx.Exec(`UPDATE sasori_users SET role = 'user' WHERE alliance_id = $1 AND role = 'admin';`, p.AllianceID)
	if err != nil {
		log.Printf("ERROR EN ENDPOINT: %v", err)
		http.Error(w, "Error al degradar líder antiguo: "+err.Error(), http.StatusInternalServerError)
		return
	}

	_, err = tx.Exec(`UPDATE sasori_users SET role = 'admin' WHERE id = $1 AND alliance_id = $2;`, p.NewLeaderID, p.AllianceID)
	if err != nil {
		log.Printf("ERROR EN ENDPOINT: %v", err)
		http.Error(w, "Error al ascender nuevo líder: "+err.Error(), http.StatusInternalServerError)
		return
	}

	if err := tx.Commit(); err != nil {
		log.Printf("ERROR EN ENDPOINT: %v", err)
		http.Error(w, "Error al confirmar Mutación en PostgreSQL", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"success": true, "message": "[ALLIANCE_LEADER_MUTATED] Privilegios jerárquicos traspasados."}`))
}

// =========================================================================
// 3) MANEJADOR: ESCANER HEURÍSTICO ANTI-CHEAT (AdminSecurityModule - TAB 1)
// =========================================================================
func (h *DBHandler) HandleAntiCheatHeuristic(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodGet {
		http.Error(w, "Método HTTP no permitido", http.StatusMethodNotAllowed)
		return
	}

	query := `SELECT id, username, level, gold, gems FROM sasori_users WHERE level < 10 AND (gold > 500000 OR gems > 5000);`
	rows, err := h.DB.Query(query)
	if err != nil {
		log.Printf("ERROR EN ENDPOINT: %v", err)
		http.Error(w, "Error de consulta heurística: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	type Anomaly struct {
		ID       string `json:"id"`
		Username string `json:"username"`
		Level    int    `json:"level"`
		Gold     int    `json:"gold"`
		Gems     int    `json:"gems"`
		Flag     string `json:"flag"`
	}

	var anomalies []Anomaly = []Anomaly{} // Inicializado vacío para evitar nulls en JS
	for rows.Next() {
		var a Anomaly
		if err := rows.Scan(&a.ID, &a.Username, &a.Level, &a.Gold, &a.Gems); err != nil {
			continue
		}
		a.Flag = "FLAG: ANOMALÍA_RIQUEZA_DETECTADA"
		anomalies = append(anomalies, a)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(anomalies)
}

// =========================================================================
// 4) MANEJADOR: INYECCIÓN DE REPORTES DE BATALLA (AdminSecurityModule - TAB 2)
// =========================================================================
func (h *DBHandler) HandleInjectBattleReport(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodPost {
		http.Error(w, "Método HTTP no permitido", http.StatusMethodNotAllowed)
		return
	}

	var p CombatReportPayload
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		http.Error(w, "JSON Payload corrupto", http.StatusBadRequest)
		return
	}

	query := `INSERT INTO sasori_pvp_battle_reports (attacker_id, attacker_name, defender_id, defender_name, winner_id, loot_stolen, battle_log, raw_json) 
	          VALUES ($1, $2, $3, $4, $5, $6, $7, $8);`

	// Uso de pq.Array() para formatear nativamente el slice []string hacia el tipo text[] de PostgreSQL
	_, err := h.DB.Exec(query, p.AttackerID, "Atacante Admin", p.DefenderID, "Defensor Admin", p.WinnerID, p.LootStolen, pq.Array(p.BattleLog), p.RawJSON)
	if err != nil {
		log.Printf("ERROR EN ENDPOINT: %v", err)
		http.Error(w, "Error al escribir Caja Negra de combate: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	w.Write([]byte(`{"success": true, "message": "[BLACK_BOX_RECORDED] Telemetría de combate PvP resguardada."}`))
}
