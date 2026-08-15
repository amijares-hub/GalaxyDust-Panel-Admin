import { supabase } from '../lib/supabase'; // Ajustado a la ruta correcta de tu cliente de Supabase

export type EntityType = 'GC' | 'GALAXY' | 'SC' | 'SS' | 'PLANET';

export interface SpaceEntity {
  id: string;
  name: string;
  parentId?: string;
  extraInfo?: string;
}

// Configuración de mapeo de tablas y llaves foráneas
export const ENTITY_CONFIG: Record<
  EntityType,
  { table: string; label: string; parentColumn?: string; parentTable?: string }
> = {
  GC: {
    table: 'seed_galaxy_clusters',
    label: 'Galaxy Cluster (GC)',
  },
  GALAXY: {
    table: 'seed_galaxies',
    label: 'Galaxia',
    parentColumn: 'cluster_id',
    parentTable: 'seed_galaxy_clusters',
  },
  SC: {
    table: 'seed_star_clusters',
    label: 'Star Cluster (SC)',
    parentColumn: 'galaxy_id',
    parentTable: 'seed_galaxies',
  },
  SS: {
    table: 'seed_star_systems',
    label: 'Star System (SS)',
    parentColumn: 'sc_id',
    parentTable: 'seed_star_clusters',
  },
  PLANET: {
    table: 'seed_planets',
    label: 'Planeta / Cuerpo',
    parentColumn: 'star_system_id',
    parentTable: 'seed_star_systems',
  },
};

/**
 * Obtiene el listado de entidades espaciales, opcionalmente filtrado por su contenedor padre.
 */
export async function fetchEntities(
  entityType: EntityType,
  parentId?: string
): Promise<SpaceEntity[]> {
  const config = ENTITY_CONFIG[entityType];
  let query = supabase.from(config.table).select('*');

  if (parentId && config.parentColumn) {
    query = query.eq(config.parentColumn, parentId);
  }

  const { data, error } = await query;

  if (error) {
    console.error(`Error al obtener ${config.label}:`, error.message);
    return [];
  }

  return (data || []).map((item: any) => ({
    id: item.id,
    name: item.name || item.name_code || `Nodo ${item.id.substring(0, 8)}`,
    parentId: config.parentColumn ? item[config.parentColumn] : undefined,
  }));
}

/**
 * Elimina de forma masiva en Supabase un conjunto de IDs en una sola consulta.
 */
export async function bulkDeleteEntities(
  entityType: EntityType,
  ids: string[]
): Promise<{ success: boolean; count: number; error?: string }> {
  if (!ids || ids.length === 0) {
    return { success: false, count: 0, error: 'No se seleccionaron elementos.' };
  }

  const config = ENTITY_CONFIG[entityType];

  const { error } = await supabase
    .from(config.table)
    .delete()
    .in('id', ids); // Ejecuta el borrado en lote de un solo paso

  if (error) {
    console.error(`Error en borrado masivo de ${config.label}:`, error.message);
    return { success: false, count: 0, error: error.message };
  }

  return { success: true, count: ids.length };
}
