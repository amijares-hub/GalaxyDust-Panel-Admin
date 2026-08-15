import React, { useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';

type EntityType = 'GC' | 'GALAXY' | 'SC' | 'SS' | 'PLANET';

interface SpaceEntity {
  id: string;
  name: string;
  parentId?: string;
}

const TABLE_MAP: Record<EntityType, { table: string; label: string }> = {
  GC: { table: 'seed_galaxy_clusters', label: 'Galaxy Clusters' },
  GALAXY: { table: 'seed_galaxies', label: 'Galaxias' },
  SC: { table: 'seed_star_clusters', label: 'Star Clusters' },
  SS: { table: 'seed_star_systems', label: 'Star Systems' },
  PLANET: { table: 'seed_planets', label: 'Planetas' },
};

export const BulkSpaceEntityManager = ({
  currentTab,
  entities,
  onRefresh,
}: {
  currentTab: EntityType;
  entities: SpaceEntity[];
  onRefresh: () => void;
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filtrado por término de búsqueda
  const filteredEntities = useMemo(() => {
    return entities.filter(
      (e) =>
        e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [entities, searchTerm]);

  // Manejo de Checkbox "Seleccionar Todo"
  const isAllSelected =
    filteredEntities.length > 0 &&
    filteredEntities.every((e) => selectedIds.includes(e.id));

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredEntities.map((e) => e.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Función de Borrado Masivo en Supabase
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    const { label, table } = TABLE_MAP[currentTab];
    const confirmMessage = `⚠️ ¿Confirmas la eliminación masiva de ${selectedIds.length} registro(s) de [${label}]?\n\nEsta acción eliminará en cascada todos los elementos dependientes de forma irreversible.`;

    if (!window.confirm(confirmMessage)) return;

    setIsDeleting(true);

    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .in('id', selectedIds); // ⚡ Una sola query para eliminar todo el lote

      if (error) throw error;

      alert(`✅ Se eliminaron ${selectedIds.length} elementos de ${label} con éxito.`);
      setSelectedIds([]);
      onRefresh(); // Recargar datos de la interfaz
    } catch (err: any) {
      alert(`❌ Error al eliminar en masa: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-[#0b0e14] border border-[#1e2638] rounded-xl p-5 text-white font-mono shadow-2xl">
      {/* HEADER CON BUSCADOR Y BOTONES DE ACCIÓN */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4 pb-4 border-b border-[#1e2638]">
        {/* Input de Búsqueda */}
        <div className="w-full md:w-1/3">
          <input
            type="text"
            placeholder={`🔍 Buscar en ${TABLE_MAP[currentTab].label}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#121824] border border-[#2a364f] text-sm text-gray-200 px-4 py-2.5 rounded-lg focus:outline-none focus:border-cyan-500 transition-all"
          />
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={handleSelectAll}
            className="px-4 py-2.5 bg-[#161d2d] hover:bg-[#202b42] border border-[#2e3d5c] text-xs font-bold text-cyan-400 rounded-lg transition-all flex items-center gap-2"
          >
            {isAllSelected ? '☑ DESMARCAR TODO' : '☐ SELECCIONAR TODO'}
          </button>

          <button
            type="button"
            disabled={selectedIds.length === 0 || isDeleting}
            onClick={handleBulkDelete}
            className={`px-5 py-2.5 text-xs font-extrabold rounded-lg transition-all flex items-center gap-2 ${
              selectedIds.length > 0 && !isDeleting
                ? 'bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white shadow-lg shadow-red-950/60 cursor-pointer animate-pulse'
                : 'bg-[#1a202c] text-gray-600 cursor-not-allowed border border-[#2d3748]'
            }`}
          >
            🔥 {isDeleting ? 'ELIMINANDO...' : `ELIMINAR EN MASA (${selectedIds.length})`}
          </button>
        </div>
      </div>

      {/* REJILLA DE ELEMENTOS SELECCIONABLES */}
      <div className="max-h-72 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pr-2 custom-scrollbar">
        {filteredEntities.length === 0 ? (
          <div className="col-span-full text-center py-10 text-gray-500 text-xs">
            No hay registros disponibles para {TABLE_MAP[currentTab].label}.
          </div>
        ) : (
          filteredEntities.map((entity) => {
            const isSelected = selectedIds.includes(entity.id);
            return (
              <div
                key={entity.id}
                onClick={() => handleToggleSelect(entity.id)}
                className={`p-3 rounded-lg border cursor-pointer select-none transition-all flex items-center justify-between ${
                  isSelected
                    ? 'bg-red-950/30 border-red-500 text-white shadow-md shadow-red-950/40'
                    : 'bg-[#121824] border-[#1e2638] text-gray-300 hover:border-[#354668] hover:bg-[#161f30]'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <span className={`text-base font-bold ${isSelected ? 'text-red-400' : 'text-gray-500'}`}>
                    {isSelected ? '☒' : '☐'}
                  </span>
                  <div className="truncate">
                    <p className="text-xs font-bold truncate text-cyan-300">{entity.name}</p>
                    <p className="text-[10px] text-gray-500 truncate">{entity.id}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};