import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Search, Filter, ShieldAlert, Award, Database, Coins, ShieldCheck, 
  Trash2, Plus, Edit, X, Save, Volume2, Shield, Sparkles, TrendingUp, BarChart2,
  GitBranch, HelpCircle, AlertTriangle
} from 'lucide-react';
import { UserProfile, InventoryItem, GameRule, GameAction } from '../types';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import * as d3 from 'd3';
import { DEFAULT_RULES } from '../data';

interface UserCRMProps {
  users: UserProfile[];
  rules?: GameRule[];
  onSaveUsers: (updated: UserProfile[]) => Promise<void>;
  setIsAlertToShow: (alert: { show: boolean; status: 'success' | 'error'; message: string }) => void;
}

// Helper to truncate labels
function truncateText(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + '…';
}

// Helper to format action names elegantly
function formatActionText(action: GameAction): string {
  switch (action.type) {
    case 'add_gold': return `+${action.params.amount?.toLocaleString()} Oro`;
    case 'add_gems': return `+${action.params.amount?.toLocaleString()} Gemas`;
    case 'grant_item': return `Otorgar: ${action.params.itemId || 'Item'}`;
    case 'multiply_xp': return `XP x${action.params.multiplier}`;
    case 'send_custom_notification': return `Mensaje Push`;
    case 'suspend_account': return `Suspender Gremio`;
    default: return 'Gatillo';
  }
}

// Full evaluation logic mimicking the real rule system
function evaluateRuleForUser(rule: GameRule, user: UserProfile): boolean {
  if (!rule.conditions || rule.conditions.length === 0) return true;
  
  return rule.conditions.every(cond => {
    let uFieldVal: any = 0;
    if (cond.field === 'user.level') uFieldVal = user.level;
    else if (cond.field === 'user.gold') uFieldVal = user.gold;
    else if (cond.field === 'user.gems') uFieldVal = user.gems;
    else if (cond.field === 'user.xp') uFieldVal = user.xp;
    else if (cond.field === 'inventory.item_count') uFieldVal = user.inventory.reduce((sum, item) => sum + item.quantity, 0);
    else if (cond.field === 'user.registration_days') {
      const regD = new Date(user.created_at);
      const diffStr = Math.abs(Date.now() - regD.getTime());
      uFieldVal = Math.ceil(diffStr / (1000 * 60 * 60 * 24)) || 7;
    }

    const cVal = typeof uFieldVal === 'number' ? Number(cond.value) : cond.value;
    const itemVal = typeof uFieldVal === 'number' ? Number(uFieldVal) : uFieldVal;

    switch (cond.operator) {
      case 'greater_than': return itemVal > cVal;
      case 'less_than': return itemVal < cVal;
      case 'equals': return itemVal === cVal;
      case 'not_equals': return itemVal !== cVal;
      case 'contains': return String(itemVal).toLowerCase().includes(String(cVal).toLowerCase());
      default: return false;
    }
  });
}

// D3 DATA FLOW VISUALIZATION COMPONENT
export function D3DataFlow({ user, rules }: { user: UserProfile; rules: GameRule[] }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 360;
    const height = 400;

    // Build hierarchical layout elements
    const activeRules = rules.map(r => ({
      ...r,
      isMatched: evaluateRuleForUser(r, user)
    }));

    const nodes: any[] = [];
    const links: any[] = [];

    // 1) Central User node on the left
    const userNodeId = 'user_root';
    nodes.push({
      id: userNodeId,
      name: user.username,
      type: 'user',
      x: 35,
      y: height / 2,
    });

    // 2) Populate columns
    activeRules.forEach((rule, index) => {
      const ruleNodeId = `rule_${rule.id}`;
      const actionNodeId = `action_${rule.id}`;

      // Distribute nodes evenly along the Y Axis
      const count = activeRules.length || 1;
      const ySpacing = height / (count + 1);
      const yPos = (index + 1) * ySpacing;

      // Rule node
      nodes.push({
        id: ruleNodeId,
        name: rule.name,
        type: 'rule',
        isMatched: rule.isMatched,
        x: 180,
        y: yPos
      });

      // Action node
      nodes.push({
        id: actionNodeId,
        name: formatActionText(rule.action),
        type: 'action',
        isMatched: rule.isMatched,
        x: 315,
        y: yPos
      });

      // Connector Links
      links.push({
        source: userNodeId,
        target: ruleNodeId,
        isMatched: rule.isMatched
      });

      links.push({
        source: ruleNodeId,
        target: actionNodeId,
        isMatched: rule.isMatched
      });
    });

    // 3) Append Link Lines with moving highlights (using standard elegant D3 attributes)
    const linkGroup = svg.append("g").attr("class", "links");
    
    linkGroup.selectAll("path")
      .data(links)
      .enter()
      .append("path")
      .attr("d", d => {
        const s = nodes.find(n => n.id === d.source);
        const t = nodes.find(n => n.id === d.target);
        if (!s || !t) return "";
        // Draw a smooth cubic bezier curve for High-End aesthetic!
        const midX = (s.x + t.x) / 2;
        return `M ${s.x} ${s.y} C ${midX} ${s.y}, ${midX} ${t.y}, ${t.x} ${t.y}`;
      })
      .attr("fill", "none")
      .attr("stroke", d => d.isMatched ? "#EF4444" : "#1a1a1e")
      .attr("stroke-width", d => d.isMatched ? 2.5 : 1)
      .attr("stroke-dasharray", d => d.isMatched ? "5 3" : "none")
      .style("opacity", d => d.isMatched ? 1 : 0.25)
      .attr("class", d => d.isMatched ? "animate-flow" : "");

    // 4) Append nodes Group
    const nodeGroup = svg.append("g").attr("class", "nodes");
    
    const nodeElements = nodeGroup.selectAll("g")
      .data(nodes)
      .enter()
      .append("g")
      .attr("transform", d => `translate(${d.x}, ${d.y})`);

    // Styling nodes based on active evaluations
    nodeElements.append("circle")
      .attr("r", d => d.type === 'user' ? 20 : d.type === 'rule' ? 12 : 9)
      .attr("fill", d => {
        if (d.type === 'user') return '#09090b';
        if (d.type === 'rule') return d.isMatched ? '#EF4444' : '#18181b';
        if (d.type === 'action') return d.isMatched ? '#10B981' : '#18181b';
        return '#020204';
      })
      .attr("stroke", d => {
        if (d.type === 'user') return '#EF4444';
        if (d.type === 'rule') return d.isMatched ? '#EF4444' : '#27272a';
        if (d.type === 'action') return d.isMatched ? '#10B981' : '#27272a';
        return '#222';
      })
      .attr("stroke-width", d => d.type === 'user' ? 2 : 1.5);

    // Mini glyphs inside nodes
    nodeElements.filter(d => d.type === 'user')
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "3")
      .attr("font-size", "10px")
      .text("👤");

    nodeElements.filter(d => d.type === 'rule')
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "2.5")
      .attr("font-size", "7.5px")
      .text("⚔️");

    nodeElements.filter(d => d.type === 'action')
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "2.5")
      .attr("font-size", "6px")
      .text("⚡");

    // Text labels styled precisely
    nodeElements.append("text")
      .attr("text-anchor", d => d.type === 'user' ? 'start' : d.type === 'action' ? 'end' : 'middle')
      .attr("dx", d => d.type === 'user' ? 26 : d.type === 'action' ? -13 : 0)
      .attr("dy", d => d.type === 'rule' ? -18 : 13)
      .attr("fill", d => {
        if (d.type === 'user') return '#ffffff';
        if (d.type === 'rule') return d.isMatched ? '#fca5a5' : '#52525b';
        return d.isMatched ? '#a7f3d0' : '#52525b';
      })
      .attr("font-family", "Space Grotesk, sans-serif")
      .attr("font-size", d => d.type === 'user' ? '10px' : '8.5px')
      .attr("font-weight", d => d.type === 'user' || d.isMatched ? 'bold' : 'normal')
      .text(d => truncateText(d.name, 17));

  }, [user, rules]);

  return (
    <div className="w-full bg-[#000001] border border-zinc-900 rounded-lg p-3 relative overflow-hidden">
      <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-2 pb-1 border-b border-zinc-900">
        <span className="flex items-center gap-1.5 font-bold"><GitBranch size={12} className="text-red-500 animate-pulse" /> MAPA DE FLUJO DE REGLAS ACTIVAS</span>
        <span className="text-[7.5px] text-zinc-700 bg-zinc-950 px-1 border border-zinc-900 rounded select-none">d3.js pipeline</span>
      </div>
      <svg ref={svgRef} className="width-full h-[360px] block" />
      
      <div className="flex items-start gap-1.5 p-2 bg-zinc-900/10 border border-zinc-900 rounded text-[9.5px] leading-relaxed text-zinc-500">
        <HelpCircle size={12} className="text-red-500 mt-0.5 shrink-0" />
        <p>Visor lineal interactivo: Muestra la ruta de inyección de recursos en tiempo real según las características del perfil actual con respecto a las reglas registradas en Sasorilabs.</p>
      </div>

      <style>{`
        @keyframes flowDash {
          to {
            stroke-dashoffset: -20;
          }
        }
        .animate-flow {
          stroke-dasharray: 6 3;
          animation: flowDash 1s linear infinite;
        }
      `}</style>
    </div>
  );
}

export default function UserCRM({ users, rules = DEFAULT_RULES, onSaveUsers, setIsAlertToShow }: UserCRMProps) {
  // Local editable users array
  const [localUsers, setLocalUsers] = useState<UserProfile[]>(() => 
    users.map(u => ({ 
      ...u, 
      inventory: u.inventory.map(i => ({ ...i })),
      auditLogs: u.auditLogs ? u.auditLogs.map(l => ({ ...l })) : []
    }))
  );

  // Filter and search keys
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'banned' | 'pending'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'vip' | 'moderator' | 'admin'>('all');

  // Multi select states for bulk operations
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Currently focused user for detail view/editing
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<'form' | 'profile' | 'd3'>('form');
  const [inventoryFilter, setInventoryFilter] = useState<'all' | 'normal' | 'event'>('all');

  const handleBulkStatusChange = (newStatus: 'active' | 'banned') => {
    const updated = localUsers.map(u => {
      if (selectedUserIds.includes(u.id)) {
        const newLog = {
          id: `log_bulk_${Date.now()}_` + Math.floor(Math.random() * 10000),
          timestamp: new Date().toISOString(),
          action: 'Estatus Lote',
          details: `Estatus cambiado en masa a "${newStatus}" por acción administrativa.`,
          type: 'status' as const
        };
        return {
          ...u,
          status: newStatus,
          auditLogs: [newLog, ...(u.auditLogs || [])]
        };
      }
      return u;
    });

    setLocalUsers(updated);
    if (onSaveUsers) {
      onSaveUsers(updated);
    }

    setIsAlertToShow({
      show: true,
      status: 'success',
      message: `¡ACCIÓN GENERAL COMPLETADA! Se actualizó el estatus de ${selectedUserIds.length} usuarios a "${newStatus}".`
    });

    setSelectedUserIds([]);
  };

  const handleDeleteUserConfirmed = () => {
    if (!editingUserId) return;
    const userToRem = localUsers.find(u => u.id === editingUserId);
    const updated = localUsers.filter(u => u.id !== editingUserId);
    setLocalUsers(updated);
    if (onSaveUsers) {
      onSaveUsers(updated);
    }
    setEditingUserId(null);
    setIsDeleteModalOpen(false);
    setIsAlertToShow({
      show: true,
      status: 'error',
      message: `¡CUENTA ELIMINADA! El jugador "${userToRem?.username || 'Usuario'}" fue removido de la confederación celular.`
    });
  };
  
  // Custom states for inventing items inside detail view
  const [newItemName, setNewItemName] = useState('');
  const [newItemRarity, setNewItemRarity] = useState<InventoryItem['rarity']>('common');
  const [newItemType, setNewItemType] = useState<InventoryItem['type']>('weapon');
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemDurability, setNewItemDurability] = useState<number>(100);

  // State for custom push notification message
  const [pushMessage, setPushMessage] = useState('');

  // CRM Statistics calculations
  const totalGold = useMemo(() => localUsers.reduce((sum, u) => sum + u.gold, 0), [localUsers]);
  const totalGems = useMemo(() => localUsers.reduce((sum, u) => sum + u.gems, 0), [localUsers]);
  const avgLevel = useMemo(() => {
    if (localUsers.length === 0) return 0;
    return Math.round((localUsers.reduce((sum, u) => sum + u.level, 0) / localUsers.length) * 10) / 10;
  }, [localUsers]);

  // Pre-configured chart data for Recharts (Player wealth analysis)
  const chartData = useMemo(() => {
    return localUsers.map(u => ({
      name: u.username,
      Nivel: u.level,
      Oro: u.gold,
      Gemas: u.gems
    })).sort((a, b) => b.Nivel - a.Nivel);
  }, [localUsers]);

  // Filtered list of users
  const filteredUsers = useMemo(() => {
    return localUsers.filter((user) => {
      const matchSearch = 
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchStatus = statusFilter === 'all' || user.status === statusFilter;
      const matchRole = roleFilter === 'all' || user.role === roleFilter;

      return matchSearch && matchStatus && matchRole;
    });
  }, [localUsers, searchTerm, statusFilter, roleFilter]);

  // Focused user details computed
  const editingUser = useMemo(() => {
    return localUsers.find(u => u.id === editingUserId) || null;
  }, [localUsers, editingUserId]);

  // Update primitive user fields nested
  const handleUpdateUserField = (id: string, field: keyof UserProfile, val: any) => {
    setLocalUsers((prev) => prev.map((u) => {
      if (u.id === id) {
        return { ...u, [field]: val };
      }
      return u;
    }));
  };

  // Add Item to dynamic user inventory list with audit logs integration
  const handleAddInventoryItem = () => {
    if (!editingUserId || !newItemName) {
      setIsAlertToShow({ show: true, status: 'error', message: 'Especifica el nombre del nuevo item visual.' });
      return;
    }

    setLocalUsers((prev) => prev.map((u) => {
      if (u.id === editingUserId) {
        const itemExistsIdx = u.inventory.findIndex(inv => inv.name.toLowerCase() === newItemName.toLowerCase());
        let updatedInventory = [...u.inventory];

        if (itemExistsIdx > -1) {
          updatedInventory[itemExistsIdx].quantity += newItemQty;
          if (newItemDurability !== undefined) {
            updatedInventory[itemExistsIdx].durability = newItemDurability;
          }
        } else {
          updatedInventory.push({
            id: `item_${Date.now()}`,
            name: newItemName,
            rarity: newItemRarity,
            type: newItemType,
            quantity: newItemQty,
            durability: newItemDurability
          });
        }

        const newLog = {
          id: `log_add_${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'Inyección de Objeto',
          details: `Inyectado: "${newItemName}" (${newItemQty} u. de rareza ${newItemRarity})`,
          type: 'inventory' as const
        };
        const updatedLogs = [newLog, ...(u.auditLogs || [])];
        return { ...u, inventory: updatedInventory, auditLogs: updatedLogs };
      }
      return u;
    }));

    setNewItemName('');
    setNewItemQty(1);
    setIsAlertToShow({ show: true, status: 'success', message: `¡Objeto "${newItemName}" inyectado con éxito en el inventario del jugador!` });
  };

  // Remove Item from inventory list with audit logs integration
  const handleRemoveInventoryItem = (itemId: string) => {
    if (!editingUserId) return;

    setLocalUsers((prev) => prev.map((u) => {
      if (u.id === editingUserId) {
        const item = u.inventory.find(i => i.id === itemId);
        const itemName = item ? item.name : 'Objeto Desconocido';
        const newLog = {
          id: `log_rem_${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'Descarte de Objeto',
          details: `Removido del inventario: "${itemName}"`,
          type: 'inventory' as const
        };
        const updatedLogs = [newLog, ...(u.auditLogs || [])];
        return {
          ...u,
          inventory: u.inventory.filter(i => i.id !== itemId),
          auditLogs: updatedLogs
        };
      }
      return u;
    }));
  };

  // Enviar mensaje de notificación push y cargarlo en los logs de auditoria
  const handleSendPushNotification = () => {
    if (!editingUserId || !pushMessage.trim()) {
      setIsAlertToShow({ show: true, status: 'error', message: 'Escribe un mensaje de notificación antes de enviar.' });
      return;
    }

    setLocalUsers((prev) => prev.map((u) => {
      if (u.id === editingUserId) {
        const newLog = {
          id: `log_push_${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'Notificación Push',
          details: `Push transmitida: "${pushMessage}"`,
          type: 'notification' as const
        };
        const updatedLogs = [newLog, ...(u.auditLogs || [])];
        return {
          ...u,
          auditLogs: updatedLogs
        };
      }
      return u;
    }));

    setIsAlertToShow({
      show: true,
      status: 'success',
      message: `¡Notificación push transmitida con éxito a ${editingUser?.username}! Ruta establecida SasoriNet-v4.`
    });
    setPushMessage('');
  };

  // Exportar los usuarios filtrados y sus métricas actuales a CSV
  const handleExportCSV = () => {
    if (filteredUsers.length === 0) {
      setIsAlertToShow({ show: true, status: 'error', message: 'No hay usuarios filtrados para exportar.' });
      return;
    }

    const headers = ['ID', 'Username', 'Email', 'Level', 'Gold', 'Gems', 'XP', 'Role', 'Status', 'Created At', 'Last Active', 'Inventory Size'];
    const rows = filteredUsers.map(u => {
      const invCount = u.inventory.reduce((sum, item) => sum + item.quantity, 0);
      return [
        u.id,
        u.username,
        u.email,
        u.level,
        u.gold,
        u.gems,
        u.xp,
        u.role,
        u.status,
        u.created_at,
        u.last_active,
        invCount
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => {
        const str = String(val).replace(/"/g, '""');
        return str.includes(',') || str.includes('\n') || str.includes('"') ? `"${str}"` : str;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `sasorilabs_users_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setIsAlertToShow({
      show: true,
      status: 'success',
      message: `¡Exportación CSV generada con éxito para ${filteredUsers.length} registros!`
    });
  };

  // Save changes to db service and log modifications
  const handleSaveUsersCRM = async () => {
    try {
      if (editingUser && editingUser.status === 'banned') {
        const dur = editingUser.ban_duration_days;
        const reason = editingUser.ban_reason;
        if (!reason || !reason.trim()) {
          setIsAlertToShow({
            show: true,
            status: 'error',
            message: 'Acción rechazada: El campo "Motivo del baneo forense" es estrictamente obligatorio para la suspensión.'
          });
          return;
        }
        if (!dur || dur <= 0) {
          setIsAlertToShow({
            show: true,
            status: 'error',
            message: 'Acción rechazada: Debe especificar un número mayor a 0 para el Periodo de Baneo en Días.'
          });
          return;
        }
      }

      const finalUsers = localUsers.map((u) => {
        if (editingUser && u.id === editingUser.id) {
          const originalUser = users.find(orig => orig.id === editingUser.id);
          const addedLogs = [];
          const timestamp = new Date().toISOString();

          if (originalUser) {
            if (originalUser.level !== editingUser.level) {
              addedLogs.push({
                id: `log_lvl_${Date.now()}_1`,
                timestamp,
                action: 'Actualización de Nivel',
                details: `Jugador cambiado de nivel ${originalUser.level} a ${editingUser.level}`,
                type: 'balance' as const
              });
            }
            if (originalUser.gold !== editingUser.gold) {
              addedLogs.push({
                id: `log_gold_${Date.now()}_2`,
                timestamp,
                action: 'Sincronización de Balance',
                details: `Oro balance editado: ${originalUser.gold.toLocaleString()} ➔ ${editingUser.gold.toLocaleString()}`,
                type: 'balance' as const
              });
            }
            if (originalUser.gems !== editingUser.gems) {
              addedLogs.push({
                id: `log_gems_${Date.now()}_3`,
                timestamp,
                action: 'Sincronización de Balance',
                details: `Gemas de balance editadas: ${originalUser.gems.toLocaleString()} ➔ ${editingUser.gems.toLocaleString()}`,
                type: 'balance' as const
              });
            }
            if (originalUser.role !== editingUser.role) {
              addedLogs.push({
                id: `log_role_${Date.now()}_4`,
                timestamp,
                action: 'Actualización de Rol',
                details: `Rol cambiado de "${originalUser.role}" a "${editingUser.role}"`,
                type: 'status' as const
              });
            }
            if (originalUser.status !== editingUser.status) {
              addedLogs.push({
                id: `log_status_${Date.now()}_5`,
                timestamp,
                action: 'Actualización de Estatus',
                details: `Estatus de acceso cambiado de "${originalUser.status}" a "${editingUser.status}"`,
                type: 'status' as const
              });
            }
          }

          const mergedLogs = [...addedLogs, ...(u.auditLogs || [])];
          return { ...editingUser, auditLogs: mergedLogs };
        }
        return u;
      });

      await onSaveUsers(finalUsers);
      setLocalUsers(finalUsers.map(u => ({
        ...u,
        inventory: u.inventory.map(i => ({ ...i })),
        auditLogs: u.auditLogs ? u.auditLogs.map(l => ({ ...l })) : []
      })));

      setIsAlertToShow({
        show: true,
        status: 'success',
        message: '¡Ficha de usuario, inyecciones y registro de auditoría actualizados en la base de datos!'
      });
      setEditingUserId(null);
    } catch (err: any) {
      setIsAlertToShow({
        show: true,
        status: 'error',
        message: err.message || 'Error al actualizar base de datos.'
      });
    }
  };

  return (
    <div className="h-full space-y-6">
      
      {/* 1. TOP CARDS METADATA - SaaS enterprise grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Card total players */}
        <div className="bg-zinc-950 border border-zinc-900/80 p-4 rounded-lg flex flex-col justify-between shadow-sm hover:border-zinc-800 transition-colors">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] uppercase font-bold font-mono text-zinc-550 tracking-wider">Total Jugadores</span>
            <span className="text-2xl font-mono font-bold tracking-tighter text-white">{localUsers.length}</span>
          </div>
          <div className="text-[9px] text-emerald-500 flex items-center gap-1 font-mono mt-1.5 border-t border-zinc-900/60 pt-1.5">
            <span>+4.2%</span>
            <span className="text-zinc-600">vs mes anterior</span>
          </div>
        </div>

        {/* Card average level */}
        <div className="bg-zinc-950 border border-zinc-900/80 p-4 rounded-lg flex flex-col justify-between shadow-sm hover:border-zinc-800 transition-colors">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] uppercase font-bold font-mono text-zinc-550 tracking-wider">Nivel Promedio</span>
            <span className="text-2xl font-mono font-bold tracking-tighter text-white">Lvl {avgLevel}</span>
          </div>
          <div className="text-[9px] text-red-500 flex items-center gap-1 font-mono mt-1.5 border-t border-zinc-900/60 pt-1.5">
            <span>-0.8%</span>
            <span className="text-zinc-600">tendencia baja</span>
          </div>
        </div>

        {/* Card entire Gold reserves */}
        <div className="bg-zinc-950 border border-zinc-900/80 p-4 rounded-lg flex flex-col justify-between shadow-sm hover:border-zinc-800 transition-colors">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] uppercase font-bold font-mono text-zinc-550 tracking-wider">Reservas Oro</span>
            <span className="text-2xl font-mono font-bold tracking-tighter text-yellow-500">{totalGold.toLocaleString()}</span>
          </div>
          <div className="text-[9px] text-emerald-500 flex items-center gap-1 font-mono mt-1.5 border-t border-zinc-900/60 pt-1.5">
            <span>+12.0%</span>
            <span className="text-zinc-600">pico detectado</span>
          </div>
        </div>

        {/* Card entire Gems reserves */}
        <div className="bg-zinc-950 border border-zinc-900/80 p-4 rounded-lg flex flex-col justify-between shadow-sm hover:border-zinc-805 border-l-2 border-l-red-650 transition-colors">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] uppercase font-bold font-mono text-zinc-550 tracking-wider">Gemas Escarlata</span>
            <span className="text-2xl font-mono font-bold tracking-tighter text-red-500">{totalGems.toLocaleString()}</span>
          </div>
          <div className="text-[9px] text-zinc-500 flex items-center gap-1 font-mono mt-1.5 border-t border-zinc-900/60 pt-1.5">
            <span>Core Optimal</span>
            <span className="text-zinc-650 font-mono tracking-tighter">Umbral &lt; 1M</span>
          </div>
        </div>

      </div>

      {/* 2. D3/RECHARTS METRIC ANALYSIS EXPANSION */}
      <div className="p-5 bg-zinc-950 border border-zinc-900 rounded-xl space-y-4">
        <div className="flex items-center gap-2">
          <BarChart2 size={16} className="text-red-500" />
          <span className="text-xs font-bold font-mono uppercase tracking-widest text-zinc-400">
            Distribución de Riquezas (Oro vs Nivel por Cuenta)
          </span>
        </div>

        <div className="h-44 w-full text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorGold" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#eab308" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorLvl" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke="#52525b" />
              <YAxis stroke="#52525b" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px', color: '#fff' }} 
              />
              <Area type="monotone" dataKey="Oro" stroke="#eab308" fillOpacity={1} fill="url(#colorGold)" />
              <Area type="monotone" dataKey="Nivel" stroke="#ef4444" fillOpacity={1} fill="url(#colorLvl)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. CRM MANAGEMENT & DIRECTORY GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* USER LIST (8 cols) */}
        <div className="lg:col-span-8 bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-4">
          
          {/* Controls Bar for user filtering */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between border-b border-zinc-900 pb-4">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3.5 top-2.5 text-zinc-550 h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar por alias o correo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-red-500 font-sans"
              />
            </div>

            {/* Micro Filters drop selectors */}
            <div className="flex gap-2.5 items-center flex-wrap sm:flex-nowrap">
              {/* Export CSV button */}
              <button
                type="button"
                onClick={handleExportCSV}
                className="py-1.5 px-3 bg-zinc-900 hover:bg-zinc-850 hover:text-white border border-zinc-850 hover:border-red-500/30 text-zinc-300 rounded text-xs font-bold font-mono tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
                title="Exportar usuarios filtrados y métricas"
              >
                <Database size={11} className="text-red-500 shrink-0" />
                <span>EXP. CSV</span>
              </button>

              {/* Status filter */}
              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                <Filter size={13} className="text-zinc-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 focus:outline-none hover:border-zinc-700 font-medium cursor-pointer"
                >
                  <option value="all">Estatus (Todos)</option>
                  <option value="active">Activos</option>
                  <option value="banned">Suspendidos</option>
                  <option value="pending">Pendientes</option>
                </select>
              </div>

              {/* Role filter */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="bg-zinc-900 border border-zinc-800 text-xs px-2.5 py-1.5 rounded focus:outline-none hover:border-zinc-700 font-medium text-zinc-400 cursor-pointer"
              >
                <option value="all">Rol (Todos)</option>
                <option value="user">Usuario</option>
                <option value="vip">VIP</option>
                <option value="moderator">Moderador</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
          </div>

          {/* TABLE DIRECTORY CONTAINER */}
          {selectedUserIds.length > 0 && (
            <div className="p-3 mb-3 bg-red-950/20 border border-red-500/20 rounded-lg flex items-center justify-between gap-3 animate-pulse text-xs font-mono text-white">
              <div className="flex items-center gap-2">
                <ShieldAlert className="text-red-500 shrink-0" size={14} />
                <span>Masa: <strong>{selectedUserIds.length}</strong> capitanes designados</span>
              </div>
              <div className="flex items-center gap-2 text-[10px]">
                <button
                  type="button"
                  onClick={() => handleBulkStatusChange('banned')}
                  className="px-2.5 py-1 bg-red-650 hover:bg-red-500 text-white font-bold rounded cursor-pointer transition-colors"
                >
                  SUSPENDER (BAN LOTE)
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkStatusChange('active')}
                  className="px-2.5 py-1 bg-emerald-650 hover:bg-emerald-500 text-white font-bold rounded cursor-pointer transition-colors"
                >
                  DEVOLVER ESTADO SEGURO (UNBAN)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedUserIds([])}
                  className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 rounded cursor-pointer transition-colors"
                >
                  ABORTAR SELECCIÓN
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-900 text-zinc-600 font-mono tracking-wider font-semibold uppercase">
                  <th className="py-3 px-3 text-center w-10">
                    <input
                      type="checkbox"
                      checked={filteredUsers.length > 0 && filteredUsers.every(u => selectedUserIds.includes(u.id))}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUserIds(prev => {
                            const newIds = [...prev];
                            filteredUsers.forEach(u => {
                              if (!newIds.includes(u.id)) newIds.push(u.id);
                            });
                            return newIds;
                          });
                        } else {
                          setSelectedUserIds(prev => prev.filter(id => !filteredUsers.map(u => u.id).includes(id)));
                        }
                      }}
                      className="accent-red-500 h-3.5 w-3.5 cursor-pointer rounded bg-black border-zinc-800"
                    />
                  </th>
                  <th className="py-3 px-3">Perfil / Alias</th>
                  <th className="py-3 px-3">Rol</th>
                  <th className="py-3 px-3">Estatus</th>
                  <th className="py-3 px-3 text-center">Nivel</th>
                  <th className="py-3 px-3 text-right">Oro</th>
                  <th className="py-3 px-3 text-right">Gemas</th>
                  <th className="py-3 px-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900/40 text-zinc-300">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-zinc-550 border-zinc-900">
                      No se encontraron usuarios con los criterios de filtrado seleccionados.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr 
                      key={user.id} 
                      className={`hover:bg-zinc-900/30 transition-colors ${editingUserId === user.id ? 'bg-red-950/10' : ''}`}
                    >
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedUserIds.includes(user.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUserIds(prev => [...prev, user.id]);
                            } else {
                              setSelectedUserIds(prev => prev.filter(id => id !== user.id));
                            }
                          }}
                          className="accent-red-500 h-3.5 w-3.5 cursor-pointer rounded bg-black border-zinc-800"
                        />
                      </td>
                      {/* Avatar and Email Username */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <img 
                            src={user.avatarUrl} 
                            alt={user.username} 
                            className="w-8 h-8 rounded-lg border border-zinc-800 object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <span className="font-semibold text-white truncate block max-w-[120px]">{user.username}</span>
                            <span className="text-[10px] text-zinc-550 truncate block max-w-[130px] font-mono">{user.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Role representation badges */}
                      <td className="py-3 px-3 self-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold capitalize ${
                          user.role === 'admin' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                          user.role === 'vip' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                          user.role === 'moderator' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                          'bg-zinc-900 text-zinc-500 border border-zinc-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>

                      {/* Status indicator circles */}
                      <td className="py-3 px-3 self-center">
                        <div className="flex items-center gap-1.5">
                          <span className={`h-1.5 w-1.5 rounded-full ${
                            user.status === 'active' ? 'bg-emerald-500' :
                            user.status === 'banned' ? 'bg-red-500' : 'bg-amber-500 animate-pulse'
                          }`} />
                          <span className="capitalize text-[11px] font-sans font-medium text-zinc-400">{user.status}</span>
                        </div>
                      </td>

                      {/* Level level */}
                      <td className="py-3 px-3 text-center font-mono text-zinc-200">
                        {user.level}
                      </td>

                      {/* Gold Coins balance inline text */}
                      <td className="py-3 px-3 text-right font-mono text-yellow-500 font-medium">
                        {user.gold.toLocaleString()}
                      </td>

                      {/* Gems reserves balance text */}
                      <td className="py-3 px-3 text-right font-mono text-red-500 font-medium">
                        {user.gems.toLocaleString()}
                      </td>

                      {/* Actions detail row selector */}
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => setEditingUserId(user.id)}
                          className="py-1 px-3 rounded hover:bg-zinc-800 border border-zinc-850 hover:border-red-500/20 text-xs font-bold font-mono tracking-wider text-red-500 hover:text-white transition-all cursor-pointer"
                        >
                          <Edit size={12} className="inline mr-1" /> EDITAR
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>

        {/* DETAILS EDITOR SLIDE EXPANSION (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <AnimatePresence mode="wait">
            {editingUser ? (
              <motion.div
                key={editingUser.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-6 flex flex-col justify-between"
              >
                {/* Header detail */}
                <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-red-500 font-mono flex items-center gap-1">
                    <ShieldAlert size={14} /> Ficha del Jugador
                  </span>
                  <button
                    onClick={() => setEditingUserId(null)}
                    className="p-1 rounded bg-zinc-905 hover:bg-zinc-900 border border-zinc-850 text-zinc-500 hover:text-white transition-colors cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Profile info card overview */}
                <div className="flex items-center gap-3 p-3 bg-zinc-900/60 border border-zinc-850 rounded-xl">
                  <img 
                    src={editingUser.avatarUrl} 
                    alt="avatar profile" 
                    className="w-12 h-12 object-cover rounded-xl border border-zinc-700 shadow-md"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-white tracking-wide">{editingUser.username}</h4>
                    <span className="text-[10px] font-mono text-zinc-550 leading-none">{editingUser.email}</span>
                  </div>
                </div>

                {/* Visual Tab Selector */}
                <div className="flex border-b border-zinc-900 text-[10px] font-mono font-bold">
                  <button
                    type="button"
                    onClick={() => setDetailTab('form')}
                    className={`flex-1 py-1 px-1 text-center border-b-2 transition-all cursor-pointer ${
                      detailTab === 'form' 
                        ? 'border-red-500 text-white bg-red-955/10' 
                        : 'border-transparent text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    📝 PROPIEDADES
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailTab('profile')}
                    className={`flex-1 py-1 px-1 text-center border-b-2 transition-all cursor-pointer ${
                      detailTab === 'profile' 
                        ? 'border-red-500 text-white bg-red-955/10' 
                        : 'border-transparent text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    🏆 METRICAS/LOGROS
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailTab('d3')}
                    className={`flex-1 py-1 px-1 text-center border-b-2 transition-all cursor-pointer ${
                      detailTab === 'd3' 
                        ? 'border-red-500 text-white bg-red-955/10' 
                        : 'border-transparent text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    🕸️ D3 SEGURIDAD
                  </button>
                </div>

                {detailTab === 'form' ? (
                  /* Form parameters containing original/* Form parameters containing original inputs */
                  <div className="space-y-4">
                    
                    {/* Status Selection and custom items */}
                    <div className="grid grid-cols-2 gap-3 bg-zinc-950/45 p-3 rounded-lg border border-zinc-900">
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest font-mono">Rol Autoridad</label>
                        <select
                          value={editingUser.role}
                          onChange={(e) => handleUpdateUserField(editingUser.id, 'role', e.target.value)}
                          className="w-full px-2.5 py-2 text-xs bg-zinc-900 text-white rounded border border-zinc-800 focus:outline-none focus:border-red-500 cursor-pointer"
                        >
                          <option value="user">User</option>
                          <option value="vip">VIP</option>
                          <option value="moderator">Moderator</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest font-mono font-bold text-red-400">Estatus Acceso</label>
                        <select
                          value={editingUser.status}
                          onChange={(e) => handleUpdateUserField(editingUser.id, 'status', e.target.value)}
                          className="w-full px-2.5 py-2 text-xs bg-zinc-900 text-white rounded border border-zinc-800 focus:outline-none focus:border-red-500 cursor-pointer"
                        >
                          <option value="active">Active</option>
                          <option value="banned">Banned</option>
                          <option value="pending">Pending</option>
                        </select>
                      </div>
                    </div>

                    {/* FORENSIC SUSPENSION PANEL */}
                    {editingUser.status === 'banned' && (
                      <div className="p-3.5 bg-red-955/15 border-2 border-red-500/40 rounded-lg space-y-3 animate-pulse">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-red-500 uppercase tracking-wider font-mono">
                          <ShieldAlert size={13} className="shrink-0" />
                          <span>🚨 Registro Forense de Suspensión Temporal</span>
                        </div>
                        <p className="text-[10px] text-zinc-400 font-sans leading-relaxed">
                          La reglamentación de Sasorilabs exige registrar la duración temporal en días y un motivo de contingencia para ser enviado automáticamente al Inbox del infractor.
                        </p>

                        <div className="grid grid-cols-3 gap-2">
                          <div className="col-span-1 space-y-1">
                            <label className="text-[9px] font-bold text-zinc-400 uppercase font-mono block">Días Suspensión</label>
                            <input
                              type="number"
                              min={1}
                              value={editingUser.ban_duration_days || 7}
                              onChange={(e) => handleUpdateUserField(editingUser.id, 'ban_duration_days', parseInt(e.target.value) || 7)}
                              className="w-full px-2 py-1.5 bg-black text-xs font-mono font-bold text-white border border-red-500/30 rounded focus:outline-none focus:border-red-500"
                            />
                          </div>
                          <div className="col-span-2 space-y-1">
                            <label className="text-[9px] font-bold text-zinc-400 uppercase font-mono block">Motivo Técnico Obligatorio</label>
                            <input
                              type="text"
                              placeholder="Ej. Abuso de exploits o spam"
                              value={editingUser.ban_reason || ''}
                              onChange={(e) => handleUpdateUserField(editingUser.id, 'ban_reason', e.target.value)}
                              className="w-full px-2 py-1.5 bg-black text-xs text-white border border-red-500/30 rounded focus:outline-none focus:border-red-500"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* LORE METADATA & FACTION SECTION */}
                    <div className="p-3 bg-zinc-950/45 rounded-lg border border-zinc-900 space-y-2.5">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-mono flex items-center gap-1">
                        🛡️ Identidad Cosmopolita y Facción Lore
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[9px] text-zinc-550 uppercase tracking-widest font-mono block">Facción Federada</label>
                          <select
                            value={editingUser.faction || 'Nova'}
                            onChange={(e) => handleUpdateUserField(editingUser.id, 'faction', e.target.value)}
                            className="w-full px-2 py-1.5 text-xs bg-zinc-900 text-white border border-zinc-800 rounded focus:outline-none focus:border-red-500 cursor-pointer"
                          >
                            <option value="Nova">Confederación Nova</option>
                            <option value="Osiris">Sindicato Osiris</option>
                            <option value="Alacran">Dinastía Alacran</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] text-zinc-550 uppercase tracking-widest font-mono block">Estado Moral del Lore</label>
                          <select
                            value={editingUser.moral_status || 'Order'}
                            onChange={(e) => handleUpdateUserField(editingUser.id, 'moral_status', e.target.value)}
                            className="w-full px-2 py-1.5 text-xs bg-zinc-900 text-white border border-zinc-800 rounded focus:outline-none focus:border-red-500 cursor-pointer"
                          >
                            <option value="Order">Order (Defensores de la Luz)</option>
                            <option value="Corrupted">Corrupted (Sectores Oscuros)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Manual economy adjustments dails */}
                    <div className="space-y-3.5 pt-1.5 border-t border-zinc-900">
                      <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                        <Sparkles size={11} className="text-red-500" /> Editor de Bóveda y 12 Recursos Vitales C.A.N.
                      </span>

                      <div className="grid grid-cols-3 gap-2">
                        {/* level */}
                        <div className="p-2 bg-zinc-900/40 border border-zinc-850 rounded text-center">
                          <span className="text-[8.5px] text-zinc-500 font-bold block uppercase font-mono">NIVEL</span>
                          <input
                            type="number"
                            value={editingUser.level}
                            onChange={(e) => handleUpdateUserField(editingUser.id, 'level', parseInt(e.target.value) || 1)}
                            className="w-full bg-transparent text-center font-mono font-bold text-white focus:outline-none focus:text-red-500 mt-0.5 text-xs"
                          />
                        </div>

                        {/* gold (GD Coins) */}
                        <div className="p-2 bg-zinc-900/40 border border-zinc-850 rounded text-center">
                          <span className="text-[8.5px] text-zinc-500 font-bold block uppercase font-mono">ORO (GD)</span>
                          <input
                            type="number"
                            value={editingUser.gold}
                            onChange={(e) => handleUpdateUserField(editingUser.id, 'gold', parseInt(e.target.value) || 0)}
                            className="w-full bg-transparent text-center font-mono font-bold text-yellow-500 focus:outline-none focus:text-yellow-400 mt-0.5 text-xs"
                          />
                        </div>

                        {/* gems (Crystals) */}
                        <div className="p-2 bg-zinc-900/40 border border-zinc-850 rounded text-center">
                          <span className="text-[8.5px] text-zinc-500 font-bold block uppercase font-mono">GEMAS</span>
                          <input
                            type="number"
                            value={editingUser.gems}
                            onChange={(e) => handleUpdateUserField(editingUser.id, 'gems', parseInt(e.target.value) || 0)}
                            className="w-full bg-transparent text-center font-mono font-bold text-emerald-400 focus:outline-none focus:text-emerald-300 mt-0.5 text-xs"
                          />
                        </div>

                        {/* metal */}
                        <div className="p-2 bg-zinc-900/40 border border-zinc-850 rounded text-center">
                          <span className="text-[8.5px] text-zinc-500 font-bold block uppercase font-mono">METAL</span>
                          <input
                            type="number"
                            value={editingUser.metal || 0}
                            onChange={(e) => handleUpdateUserField(editingUser.id, 'metal', parseInt(e.target.value) || 0)}
                            className="w-full bg-transparent text-center font-mono font-bold text-zinc-400 focus:outline-none focus:text-zinc-300 mt-0.5 text-xs"
                          />
                        </div>

                        {/* deuterium */}
                        <div className="p-2 bg-zinc-900/40 border border-zinc-850 rounded text-center">
                          <span className="text-[8.5px] text-zinc-500 font-bold block uppercase font-mono">DEUTERIO</span>
                          <input
                            type="number"
                            value={editingUser.deuterium || 0}
                            onChange={(e) => handleUpdateUserField(editingUser.id, 'deuterium', parseInt(e.target.value) || 0)}
                            className="w-full bg-transparent text-center font-mono font-bold text-indigo-400 focus:outline-none focus:text-indigo-300 mt-0.5 text-xs"
                          />
                        </div>

                        {/* dark_matter */}
                        <div className="p-2 bg-zinc-900/40 border border-zinc-850 rounded text-center">
                          <span className="text-[8.5px] text-zinc-500 font-bold block uppercase font-mono">M. OSCURA</span>
                          <input
                            type="number"
                            value={editingUser.dark_matter || 0}
                            onChange={(e) => handleUpdateUserField(editingUser.id, 'dark_matter', parseInt(e.target.value) || 0)}
                            className="w-full bg-transparent text-center font-mono font-bold text-fuchsia-400 focus:outline-none focus:text-fuchsia-300 mt-0.5 text-xs"
                          />
                        </div>

                        {/* organium */}
                        <div className="p-2 bg-zinc-900/40 border border-zinc-850 rounded text-center">
                          <span className="text-[8.5px] text-zinc-500 font-bold block uppercase font-mono">ORGANIUM</span>
                          <input
                            type="number"
                            value={editingUser.organium || 0}
                            onChange={(e) => handleUpdateUserField(editingUser.id, 'organium', parseInt(e.target.value) || 0)}
                            className="w-full bg-transparent text-center font-mono font-bold text-amber-500 focus:outline-none focus:text-amber-400 mt-0.5 text-xs"
                          />
                        </div>

                        {/* mana */}
                        <div className="p-2 bg-zinc-900/40 border border-zinc-850 rounded text-center">
                          <span className="text-[8.5px] text-zinc-500 font-bold block uppercase font-mono">MANA</span>
                          <input
                            type="number"
                            value={editingUser.mana || 0}
                            onChange={(e) => handleUpdateUserField(editingUser.id, 'mana', parseInt(e.target.value) || 0)}
                            className="w-full bg-transparent text-center font-mono font-bold text-cyan-400 focus:outline-none focus:text-cyan-300 mt-0.5 text-xs"
                          />
                        </div>

                        {/* xenoplasm */}
                        <div className="p-2 bg-zinc-900/40 border border-zinc-850 rounded text-center">
                          <span className="text-[8.5px] text-zinc-500 font-bold block uppercase font-mono font-mono">XENOPLASM</span>
                          <input
                            type="number"
                            value={editingUser.xenoplasm || 0}
                            onChange={(e) => handleUpdateUserField(editingUser.id, 'xenoplasm', parseInt(e.target.value) || 0)}
                            className="w-full bg-transparent text-center font-mono font-bold text-lime-400 focus:outline-none focus:text-lime-350 mt-0.5 text-xs"
                          />
                        </div>

                        {/* omniplate */}
                        <div className="p-2 bg-zinc-900/40 border border-zinc-850 rounded text-center">
                          <span className="text-[8.5px] text-zinc-500 font-bold block uppercase font-mono">OMNIPLATE</span>
                          <input
                            type="number"
                            value={editingUser.omniplate || 0}
                            onChange={(e) => handleUpdateUserField(editingUser.id, 'omniplate', parseInt(e.target.value) || 0)}
                            className="w-full bg-transparent text-center font-mono font-bold text-teal-400 focus:outline-none focus:text-teal-350 mt-0.5 text-xs"
                          />
                        </div>

                        {/* lunar_fiber */}
                        <div className="p-2 bg-zinc-900/40 border border-zinc-850 rounded text-center">
                          <span className="text-[8.5px] text-zinc-500 font-bold block uppercase font-mono">FIBRA LUNAR</span>
                          <input
                            type="number"
                            value={editingUser.lunar_fiber || 0}
                            onChange={(e) => handleUpdateUserField(editingUser.id, 'lunar_fiber', parseInt(e.target.value) || 0)}
                            className="w-full bg-transparent text-center font-mono font-bold text-violet-400 focus:outline-none focus:text-violet-300 mt-0.5 text-xs"
                          />
                        </div>

                        {/* infinite_core */}
                        <div className="p-2 bg-zinc-900/40 border border-zinc-850 rounded text-center">
                          <span className="text-[8.5px] text-zinc-500 font-bold block uppercase font-mono">INFINITE CORE</span>
                          <input
                            type="number"
                            value={editingUser.infinite_core || 0}
                            onChange={(e) => handleUpdateUserField(editingUser.id, 'infinite_core', parseInt(e.target.value) || 0)}
                            className="w-full bg-transparent text-center font-mono font-bold text-rose-500 focus:outline-none focus:text-rose-400 mt-0.5 text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Active inventory visual tracker */}
                    <div className="space-y-3 pt-1.5 border-t border-zinc-900">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest font-mono">
                          Colección del Piloto ({editingUser.inventory.length})
                        </span>
                        
                        {/* Collection Filter Buttons */}
                        <div className="flex gap-1 bg-zinc-950 p-0.5 border border-zinc-900 rounded font-mono text-[8px]">
                          {(['all', 'normal', 'event'] as const).map(f => (
                            <button
                              key={f}
                              type="button"
                              onClick={() => setInventoryFilter(f)}
                              className={`px-1.5 py-0.5 rounded uppercase font-bold transition-all cursor-pointer ${
                                inventoryFilter === f 
                                  ? 'bg-red-500/20 text-red-400 border border-red-500/40' 
                                  : 'text-zinc-500 border border-transparent hover:text-zinc-400'
                              }`}
                            >
                               {f}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* INVENTORY SPLIT: MANTENIMIENTO CRÍTICO VS NORMAL ASSETS */}
                      <div className="space-y-3">
                        {(() => {
                          const baseFilteredList = editingUser.inventory.filter(item => {
                            const isEvent = item.name.toLowerCase().includes('evento') || 
                                            item.name.toLowerCase().includes('navidad') || 
                                            item.name.toLowerCase().includes('christmas') ||
                                            item.name.toLowerCase().includes('exclusive') || 
                                            item.name.toLowerCase().includes('seal') || 
                                            item.name.toLowerCase().includes('star') || 
                                            item.name.toLowerCase().includes('inara') || 
                                            item.rarity?.toLowerCase() === 'legendary';
                            if (inventoryFilter === 'normal') return !isEvent;
                            if (inventoryFilter === 'event') return isEvent;
                            return true;
                          });

                          // Group by Durability <= 10%
                          const lowDurabilityItems = baseFilteredList.filter(i => i.durability !== undefined && i.durability <= 10);
                          const healthyItems = baseFilteredList.filter(i => i.durability === undefined || i.durability > 10);

                          return (
                            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                              
                              {/* Group A: CRITICAL PROTECTION MAINTENANCE ROUTINE */}
                              {lowDurabilityItems.length > 0 && (
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-1 text-[9.5px] font-extrabold text-amber-500 uppercase tracking-wider font-mono px-1">
                                    <AlertTriangle size={11} className="text-amber-500 shrink-0" />
                                    <span>⚠️ Alerta: Mantenimiento Crítico (Durabilidad ≤ 10%)</span>
                                  </div>
                                  <div className="space-y-1">
                                    {lowDurabilityItems.map((inv) => (
                                      <div key={inv.id} className="flex items-center justify-between p-2 bg-[#1a0a0a] border-2 border-red-500 rounded-md text-[11px] hover:scale-[1.01] transition-transform">
                                        <div className="min-w-0">
                                          <div className="flex items-center gap-1.5">
                                            <span className="font-bold text-red-400 block truncate">{inv.name}</span>
                                            <span className="text-[8px] bg-red-950 text-red-400 px-1 py-0.2 select-none border border-red-500/40 rounded font-mono font-extrabold">RIESGO</span>
                                          </div>
                                          <span className={`text-[9px] font-mono uppercase block mt-0.5 ${
                                            inv.rarity === 'legendary' ? 'text-red-500 font-bold' :
                                            inv.rarity === 'epic' ? 'text-purple-400' :
                                            inv.rarity === 'rare' ? 'text-blue-400' : 'text-zinc-500'
                                          }`}>
                                            x{inv.quantity} · {inv.rarity} {inv.type} · <span className="text-red-500 font-bold font-mono">Durabilidad: {inv.durability}%</span>
                                          </span>
                                        </div>
                                        <button
                                          onClick={() => handleRemoveInventoryItem(inv.id)}
                                          className="text-zinc-550 hover:text-red-500 transition-colors p-1 rounded hover:bg-black/30"
                                          title="Purgar activo"
                                        >
                                          <Trash2 size={11} />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Group B: HEALTHY CONFEDERATION ASSETS */}
                              <div className="space-y-1">
                                {lowDurabilityItems.length > 0 && healthyItems.length > 0 && (
                                  <span className="text-[9px] font-bold text-zinc-550 uppercase font-mono px-1 block pt-1.5">
                                    Activos de Flota Saludables
                                  </span>
                                )}
                                {healthyItems.length === 0 && lowDurabilityItems.length === 0 ? (
                                  <div className="text-center py-4 text-zinc-650 text-[9.5px] bg-black/20 border border-zinc-900 border-dashed rounded font-mono">
                                    Ningún item coincide con {inventoryFilter.toUpperCase()} loot.
                                  </div>
                                ) : (
                                  healthyItems.map((inv) => (
                                    <div key={inv.id} className="flex items-center justify-between p-2 bg-black/30 rounded border border-zinc-850 text-[11px] hover:bg-zinc-900/40 transition-colors">
                                      <div className="min-w-0">
                                        <span className="font-semibold text-zinc-200 block truncate">{inv.name}</span>
                                        <span className={`text-[9px] font-mono uppercase ${
                                          inv.rarity === 'legendary' ? 'text-red-500 font-bold' :
                                          inv.rarity === 'epic' ? 'text-purple-400' :
                                          inv.rarity === 'rare' ? 'text-blue-400' : 'text-zinc-500'
                                        }`}>
                                          x{inv.quantity} · {inv.rarity} {inv.type} {inv.durability !== undefined ? `· Durabilidad: ${inv.durability}%` : ''}
                                        </span>
                                      </div>
                                      <button
                                        onClick={() => handleRemoveInventoryItem(inv.id)}
                                        className="text-zinc-650 hover:text-red-500 transition-colors p-1 rounded hover:bg-zinc-850"
                                        title="Descartar del inventario"
                                      >
                                        <Trash2 size={11} />
                                      </button>
                                    </div>
                                  ))
                                )}
                              </div>

                            </div>
                          );
                        })()}
                      </div>

                      {/* Inyect Item Box Row mini-form */}
                      <div className="bg-zinc-900/40 border border-zinc-850 p-3 rounded-lg space-y-2.5">
                        <span className="text-[10px] font-extrabold text-[#ff1e1e] uppercase tracking-wider block font-mono">
                          ⚡ Inyectar Objeto Especializado de Juego
                        </span>
                        
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            placeholder="Nombre Ej. Arco Iónico"
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            className="flex-1 px-2.5 py-1.5 text-xs bg-black border border-zinc-800 text-white rounded focus:outline-none focus:border-red-500"
                          />
                          <input
                            type="number"
                            min={1}
                            placeholder="Cant"
                            value={newItemQty}
                            onChange={(e) => setNewItemQty(parseInt(e.target.value) || 1)}
                            className="w-12 px-1 py-1.5 text-xs bg-black border border-zinc-800 text-center font-mono text-white rounded focus:outline-none focus:border-red-500"
                          />
                        </div>

                        {/* Durability and item type inputs row */}
                        <div className="grid grid-cols-2 gap-1.5">
                          <div className="space-y-1">
                            <label className="text-[8.5px] font-bold text-zinc-550 font-mono uppercase">Categoría</label>
                            <select
                              value={newItemType}
                              onChange={(e) => setNewItemType(e.target.value as any)}
                              className="w-full px-2 py-1 bg-black text-xs text-zinc-300 rounded border border-zinc-800"
                            >
                              <option value="weapon">Weapon (Arma)</option>
                              <option value="armor">Armor (Blindaje)</option>
                              <option value="consumable">Consumable</option>
                              <option value="badge">Badge/Insignia</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[8.5px] font-bold text-zinc-550 font-mono uppercase">Durabilidad ({newItemDurability}%)</label>
                            <input
                              type="range"
                              min={0}
                              max={100}
                              value={newItemDurability}
                              onChange={(e) => setNewItemDurability(parseInt(e.target.value) || 0)}
                              className="w-full accent-red-500 cursor-pointer text-xs"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5 text-[11px] pt-1">
                          <select
                            value={newItemRarity}
                            onChange={(e) => setNewItemRarity(e.target.value as any)}
                            className="px-2 py-1.5 bg-black text-zinc-300 rounded border border-zinc-800"
                          >
                            <option value="common">Común</option>
                            <option value="rare">Raro</option>
                            <option value="epic">Épico</option>
                            <option value="legendary">Legendario</option>
                          </select>
                          <button
                            type="button"
                            onClick={handleAddInventoryItem}
                            className="py-1 px-3 bg-[#ff1e1e] hover:bg-red-500 text-white font-bold uppercase text-[9px] rounded flex items-center justify-center gap-1.5 cursor-pointer transition-all border border-[#ff1e1e]/40 shadow-lg shadow-red-950/20"
                          >
                            <Plus size={10} /> Inyectar Objeto
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* AUDIT LOGS COMPONENT */}
                    <div className="space-y-2.5 pt-2 border-t border-zinc-900">
                      <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest flex items-center justify-between">
                        <span>Registro de Auditoría (Últimos 5)</span>
                        <span className="text-[8px] font-mono text-zinc-550 lowercase">Solo Lectura</span>
                      </span>

                      <div className="space-y-1 max-h-[140px] overflow-y-auto pr-1">
                        {(!editingUser.auditLogs || editingUser.auditLogs.length === 0) ? (
                          <div className="text-[9.5px] text-zinc-650 italic text-center py-4 bg-black/20 rounded border border-zinc-900">
                            Sin modificaciones recientes registradas.
                          </div>
                        ) : (
                          editingUser.auditLogs.slice(0, 5).map((log) => (
                            <div 
                              key={log.id} 
                              className="p-1.5 bg-[#0a0a0c] border border-zinc-900 rounded text-[10px]"
                            >
                              <div className="flex justify-between items-center mb-0.5">
                                <span className={`px-1 rounded-[2px] text-[7.5px] font-mono font-bold uppercase tracking-wide ${
                                  log.type === 'balance' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/10' :
                                  log.type === 'inventory' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/10' :
                                  log.type === 'notification' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/10' :
                                  'bg-zinc-900 text-zinc-500'
                                }`}>
                                  {log.action}
                                </span>
                                <span className="text-[8px] text-zinc-600 font-mono">
                                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-zinc-450 leading-tight font-sans">{log.details}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* CUSTOM PUSH NOTIFICATIONS MODULE */}
                    <div className="space-y-2 pt-2 border-t border-zinc-900">
                      <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                        <Volume2 size={11} className="text-red-500 shrink-0" />
                        <span>Notificación Push Directa</span>
                      </span>
                      <div className="space-y-1.5">
                        <textarea
                          rows={2}
                          placeholder="Mensaje automático para la consola del usuario..."
                          value={pushMessage}
                          onChange={(e) => setPushMessage(e.target.value)}
                          className="w-full px-2 py-1 text-[10.5px] bg-black hover:bg-zinc-950 border border-zinc-850 focus:border-red-500 rounded text-zinc-200 focus:outline-none placeholder-zinc-750 transition-colors resize-none"
                        />
                        <button
                          type="button"
                          onClick={handleSendPushNotification}
                          className="w-full py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 text-zinc-400 hover:text-white font-bold uppercase text-[8.5px] rounded flex items-center justify-center gap-1 cursor-pointer transition-colors"
                        >
                          <Volume2 size={10} /> Transmitir Push
                        </button>
                      </div>
                    </div>

                    {/* Chronological Recharts Timeline */}
                    <div className="space-y-2 pt-2 border-t border-zinc-900">
                      <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest block font-mono">
                        📈 LÍNEA DE TIEMPO OPERACIONAL (HISTORIAL RECHARTS)
                      </span>
                      <div className="h-28 w-full bg-black/40 border border-zinc-900 rounded p-1.5">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart
                            data={
                              editingUser.auditLogs && editingUser.auditLogs.length > 0 
                                ? [...editingUser.auditLogs].reverse().map((log, idx) => ({
                                    idx: idx + 1,
                                    time: new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                    action: log.action,
                                    score: log.type === 'balance' ? 3 : log.type === 'inventory' ? 2.5 : log.type === 'status' ? 4 : 1
                                  }))
                                : [{ idx: 1, time: '00:00', action: 'Inactividad', score: 0 }]
                            }
                            margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
                          >
                            <defs>
                              <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0}/>
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="time" stroke="#52525b" fontSize={8} tickLine={false} />
                            <YAxis stroke="#52525b" fontSize={8} tickLine={false} domain={[0, 5]} />
                            <Tooltip 
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const d = payload[0].payload;
                                  return (
                                    <div className="bg-zinc-950 border border-zinc-800 p-1.5 rounded text-[9px] font-mono border-zinc-800">
                                      <span className="text-zinc-500">{d.time}:</span> <span className="text-red-400 font-bold">{d.action}</span>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Area type="monotone" dataKey="score" stroke="#ef4444" strokeWidth={1} fillOpacity={1} fill="url(#colorScore)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                  </div>
                ) : detailTab === 'profile' ? (
                  /* PvP-PvE analysis, Achievements, and Missions dashboard tracker */
                  <div className="space-y-4">
                    {/* PVP / PVE Stats */}
                    <span className="text-[11.5px] font-bold text-zinc-400 uppercase tracking-widest font-mono block">
                      ⚔️ Métrica de Combate (PVP - PVE)
                    </span>
                    <div className="grid grid-cols-2 gap-2 bg-zinc-950 border border-zinc-900 p-2 text-xs font-mono">
                      <div className="p-2 bg-zinc-900/40 rounded border border-zinc-900">
                        <span className="text-[8.5px] text-zinc-500 block uppercase font-bold">Arena PVP</span>
                        <div className="flex justify-between items-baseline mt-1 font-bold">
                          <span className="text-white text-[12px]">{editingUser.pvpWins || 54}W - {editingUser.pvpLosses || 12}L</span>
                          <span className="text-emerald-400 text-[9px]">
                            {Math.round(((editingUser.pvpWins || 54) / ((editingUser.pvpWins || 54) + (editingUser.pvpLosses || 12))) * 100)}% Win
                          </span>
                        </div>
                        <div className="text-[8px] text-zinc-550 mt-1 uppercase">
                          Ataques: {editingUser.attacksPerformed || 412} rz / {editingUser.attacksReceived || 184} rec
                        </div>
                      </div>

                      <div className="p-2 bg-zinc-900/40 rounded border border-zinc-900">
                        <span className="text-[8.5px] text-zinc-500 block uppercase font-bold">Campaña PVE</span>
                        <div className="flex justify-between items-baseline mt-1 font-bold">
                          <span className="text-white text-[12px]">{editingUser.pveWins || 132}W - {editingUser.pveLosses || 19}L</span>
                          <span className="text-emerald-400 text-[9px]">
                            {Math.round(((editingUser.pveWins || 132) / ((editingUser.pveWins || 132) + (editingUser.pveLosses || 19))) * 100)}% Win
                          </span>
                        </div>
                        <div className="text-[8px] text-zinc-550 mt-1 uppercase">
                          Sectores Dominados: 12 Clúster
                        </div>
                      </div>
                    </div>

                    {/* Achievements System Drawer */}
                    <div className="space-y-2 pt-2 border-t border-zinc-900 font-mono">
                      <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest block flex justify-between items-center">
                        <span>🏆 Logros Desbloqueados</span>
                        <span className="px-1.5 py-0.2 bg-zinc-900 border border-zinc-800 rounded font-black text-red-500 text-[8.5px]">
                          3 COMPLETO
                        </span>
                      </span>
                      
                      <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                        {[
                          { title: 'Primer Vuelo', desc: 'Completar con éxito un salto hiperespacial', unlockedIcon: '🚀', date: '2026-05-10T12:00:00Z' },
                          { title: 'Generosidad de Estación', desc: 'Renovar el stock de Hangar 5 veces', unlockedIcon: '🛸', date: '2026-05-15T15:24:00Z' },
                          { title: 'Veterano de Combate', desc: 'Alcanzar el nivel 10 con un operador', unlockedIcon: '🛡️', date: '2026-05-22T09:12:00Z' },
                        ].map((ach, idx) => (
                          <div key={idx} className="p-2 bg-black/40 border border-zinc-900 rounded flex gap-2.5 items-center hover:bg-zinc-950 transition-all">
                            <span className="text-sm select-none">{ach.unlockedIcon}</span>
                            <div className="flex-1">
                              <span className="text-[10px] text-white font-bold block leading-none font-sans">{ach.title}</span>
                              <span className="text-[8.5px] text-zinc-500 font-sans block mt-0.5">{ach.desc}</span>
                            </div>
                            <span className="text-[7.5px] text-zinc-500 font-mono shrink-0">
                              {new Date(ach.date).toLocaleDateString([], { month: 'short', day: '2-digit' })}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Missions state (Daily, Weekly, Monthly, Event) */}
                    <div className="space-y-2 pt-2 border-t border-zinc-900 font-mono">
                      <span className="text-[11.5px] font-bold text-zinc-400 uppercase tracking-widest block">
                        🎯 Programa de Misiones Activas
                      </span>

                      <div className="space-y-1.5 max-h-[170px] overflow-y-auto pr-1">
                        {[
                          { id: 'm-1', type: 'Daily', title: 'Realizar 3 Expediciones', isCompleted: true, progress: '3/3' },
                          { id: 'm-2', type: 'Weekly', title: 'Quemar 500 Phantom Coins', isCompleted: false, progress: '350/500 PC' },
                          { id: 'm-3', type: 'Monthly', title: 'Alcanzar el Nivel 15', isCompleted: false, progress: `${editingUser.level}/15 NIV` },
                          { id: 'm-4', type: 'Event', title: 'Coleccionar 2 Planos de Élite', isCompleted: true, progress: '2/2 PLANOS' },
                        ].map((m, idx) => (
                          <div key={idx} className="p-2 bg-zinc-900/25 border border-zinc-900 rounded flex justify-between items-center text-xs">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className={`px-1 rounded-[2px] text-[7px] font-mono font-black uppercase ${
                                  m.type === 'Daily' ? 'bg-cyan-950 text-cyan-400 border border-cyan-900' :
                                  m.type === 'Weekly' ? 'bg-purple-950 text-purple-400 border border-purple-900' :
                                  m.type === 'Monthly' ? 'bg-amber-950 text-amber-500 border border-amber-900' :
                                  'bg-red-950 text-red-400 border border-red-900'
                                }`}>
                                  {m.type}
                                </span>
                                <span className="text-white font-bold font-sans text-[10px]">{m.title}</span>
                              </div>
                              <span className="text-[8px] text-zinc-500 font-mono mt-0.5 block uppercase">Progreso: {m.progress}</span>
                            </div>

                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono leading-none font-bold ${
                              m.isCompleted 
                                ? 'bg-[#00ff66]/10 text-[#00ff66] border border-[#00ff66]/20' 
                                : 'bg-zinc-900 text-zinc-550 border border-zinc-800'
                            }`}>
                              {m.isCompleted ? '✓ COMPLETO' : 'EN CURSO'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                ) : (
                  /* Live D3.js Data Flow diagram representing fired rules policies */
                  <div className="space-y-4">
                    <D3DataFlow user={editingUser} rules={rules} />
                  </div>
                )}

                {/* Confirm application of changes updates & DELETION */}
                <div className="pt-4 border-t border-zinc-900 space-y-2">
                  <button
                    onClick={handleSaveUsersCRM}
                    className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <Save size={13} /> Guardar Ficha Completa
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="w-full py-2 bg-red-950/20 hover:bg-red-950/40 border border-red-950/30 text-red-500 font-bold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <Trash2 size={13} /> ELIMINAR CUENTA DE JUGADOR
                  </button>
                </div>

              </motion.div>
            ) : (
              <div className="h-full min-h-[420px] bg-zinc-950/40 border-2 border-dashed border-zinc-900 rounded-xl flex flex-col items-center justify-center text-center p-6 text-zinc-600">
                <Users size={32} className="mb-2 text-zinc-800" />
                <h4 className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">
                  Sin Ficha de Jugador
                </h4>
                <p className="text-[11px] max-w-xs mt-1 leading-normal">
                  Haz clic sobre el botón "EDITAR" de cualquier usuario para cargar su CRM completa de inventario, metrics e inyecciones de recursos.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* ELIMINAR JUGADOR CONFIRMATION MODAL */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-950 border border-zinc-800 p-6 rounded-lg max-w-sm w-full space-y-4"
            >
              <div className="flex items-center gap-2.5 text-red-500 font-mono font-bold uppercase tracking-wider text-xs">
                <AlertTriangle size={18} className="animate-bounce" />
                <span>CONFIRMACIÓN DE BORRADO</span>
              </div>
              
              <p className="text-xs text-zinc-400 leading-normal">
                ¿Está seguro de que desea eliminar la cuenta de <strong>{editingUser?.username}</strong> ({editingUser?.email})? Este cambio purgará su registro del CRM de forma permanente.
              </p>

              <div className="flex items-center justify-end gap-2.5 font-mono text-[9px]">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-3 py-1.5 bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 text-zinc-400 rounded cursor-pointer"
                >
                  ABORTAR
                </button>
                <button
                  onClick={handleDeleteUserConfirmed}
                  className="px-3 py-1.5 bg-red-650 hover:bg-red-550 text-white font-bold rounded cursor-pointer"
                >
                  DESTRUIR REGISTRO 💀
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
