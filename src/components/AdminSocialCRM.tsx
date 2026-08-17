import React, { useState, useEffect } from 'react';
import { 
  Users, MessageSquare, ShieldAlert, Search, Eye, 
  Ban, Shield, X, UserX, Clock, CheckCircle2, Trash2 
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';

interface AdminSocialCRMProps {
  users: UserProfile[];
}

export const AdminSocialCRM: React.FC<AdminSocialCRMProps> = ({ users }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  
  // Estados para Auditoría Social
  const [friendships, setFriendships] = useState<any[]>([]);
  const [messagesLog, setMessagesLog] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  
  // Estado para el Modal de Tarjeta de Perfil
  const [showProfileCard, setShowProfileCard] = useState<UserProfile | null>(null);

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const fetchSocialData = async (userId: string) => {
    if (!supabase) return;
    setLoadingData(true);

    try {
      // 1. Obtener lista de amigos (Enviadas o Recibidas)
      const { data: friendsData } = await supabase
        .from('friendships')
        .select(`
          id, status, created_at,
          requester:requester_id (id, username, level, status),
          receiver:receiver_id (id, username, level, status)
        `)
        .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (friendsData) setFriendships(friendsData);

      // 2. Obtener historial de mensajes (Auditoría)
      const { data: msgsData } = await supabase
        .from('direct_messages')
        .select(`
          id, message_text, is_read, created_at,
          sender:sender_id (id, username),
          receiver:receiver_id (id, username)
        `)
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (msgsData) setMessagesLog(msgsData);

    } catch (error) {
      console.error("Error cargando datos sociales", error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSelectUser = (user: UserProfile) => {
    setSelectedUser(user);
    fetchSocialData(user.id);
  };

  const deleteMessage = async (msgId: string) => {
    if (!supabase || !window.confirm("¿Borrar este mensaje por violar las normas?")) return;
    const { error } = await supabase.from('direct_messages').delete().eq('id', msgId);
    if (!error) {
      setMessagesLog(prev => prev.filter(m => m.id !== msgId));
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6 font-mono text-xs text-left text-white animate-fadeIn p-6">
      
      {/* HEADER */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users className="text-cyan-500" size={20} /> CRM Social y Auditoría de Redes
          </h2>
          <p className="text-zinc-500 mt-1 font-sans">
            Inspecciona conexiones de amigos, audita chats privados y gestiona bloqueos por toxicidad o multicuentas.
          </p>
        </div>
        <div className="relative w-full md:w-64">
          <input 
            type="text" 
            placeholder="Buscar comandante..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-white outline-none focus:border-cyan-500 uppercase"
          />
          <Search size={14} className="absolute left-3 top-2.5 text-zinc-500" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 h-[calc(100vh-200px)]">
        
        {/* COLUMNA IZQUIERDA: LISTA DE USUARIOS */}
        <div className="bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden flex flex-col">
          <div className="p-3 bg-zinc-900/50 border-b border-zinc-900 text-[10px] font-bold uppercase text-zinc-400 tracking-widest">
            Comandantes ({filteredUsers.length})
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {filteredUsers.map(u => (
              <button 
                key={u.id} 
                onClick={() => handleSelectUser(u)}
                className={`w-full text-left p-3 border-b border-zinc-900/50 hover:bg-zinc-900 transition-colors flex items-center justify-between cursor-pointer ${selectedUser?.id === u.id ? 'bg-zinc-900/80 border-l-2 border-l-cyan-500' : ''}`}
              >
                <div>
                  <span className={`font-bold block truncate max-w-[150px] ${u.status === 'banned' ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>
                    {u.username}
                  </span>
                  <span className="text-[9px] text-zinc-500 block">Lvl {u.level}</span>
                </div>
                {u.status === 'banned' && <Ban size={12} className="text-red-500 opacity-50" />}
              </button>
            ))}
          </div>
        </div>

        {/* COLUMNAS DERECHA: AUDITORÍA (Solo visible si hay usuario seleccionado) */}
        {selectedUser ? (
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-hidden">
            
            {/* PANEL RED DE CONTACTOS */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-xl flex flex-col">
              <div className="p-3 bg-zinc-900/50 border-b border-zinc-900 flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase text-cyan-500 tracking-widest flex items-center gap-1.5">
                  <Users size={12} /> Red de Contactos
                </span>
                <button 
                  onClick={() => setShowProfileCard(selectedUser)}
                  className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800 rounded text-[9px] uppercase cursor-pointer transition-colors"
                >
                  Ver Tarjeta Pública
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {loadingData ? (
                  <div className="text-center p-5 text-zinc-600">Escaneando red...</div>
                ) : friendships.length === 0 ? (
                  <div className="text-center p-5 text-zinc-600 border border-dashed border-zinc-800 rounded-lg m-2">
                    El comandante no tiene conexiones sociales registradas.
                  </div>
                ) : (
                  friendships.map(f => {
                    // Identificar quién es el amigo en esta relación
                    const isRequester = f.requester.id === selectedUser.id;
                    const friend = isRequester ? f.receiver : f.requester;
                    
                    return (
                      <div key={f.id} className="p-2.5 bg-zinc-900/30 border border-zinc-850 rounded-lg flex items-center justify-between">
                        <div>
                          <span className="font-bold text-zinc-200 text-xs block">{friend.username}</span>
                          <span className="text-[9px] text-zinc-500 flex items-center gap-1">
                            {isRequester ? 'Solicitó' : 'Recibió'} el {new Date(f.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className={`px-2 py-0.5 rounded text-[9px] font-bold border flex items-center gap-1 ${
                          f.status === 'ACCEPTED' ? 'bg-emerald-950/50 text-emerald-400 border-emerald-900' :
                          f.status === 'BLOCKED' ? 'bg-red-950/50 text-red-400 border-red-900' :
                          'bg-amber-950/50 text-amber-400 border-amber-900'
                        }`}>
                          {f.status === 'ACCEPTED' && <CheckCircle2 size={10} />}
                          {f.status === 'BLOCKED' && <UserX size={10} />}
                          {f.status === 'PENDING' && <Clock size={10} />}
                          {f.status}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* PANEL AUDITORÍA DE DMs */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-xl flex flex-col relative">
              <div className="p-3 bg-red-950/20 border-b border-red-900/30 flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase text-red-400 tracking-widest flex items-center gap-1.5">
                  <MessageSquare size={12} /> Log de Comunicaciones (DMs)
                </span>
                <ShieldAlert size={12} className="text-red-500" title="Auditoría Restringida" />
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                {loadingData ? (
                  <div className="text-center p-5 text-zinc-600">Desencriptando transmisiones...</div>
                ) : messagesLog.length === 0 ? (
                  <div className="text-center p-5 text-zinc-600">
                    Bandeja limpia. No hay transmisiones recientes.
                  </div>
                ) : (
                  messagesLog.map(msg => {
                    const isSender = msg.sender.id === selectedUser.id;
                    return (
                      <div key={msg.id} className={`flex flex-col max-w-[90%] ${isSender ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                        <div className="flex items-center gap-1.5 mb-1 opacity-60">
                          <span className="text-[9px] font-bold uppercase text-zinc-400">{isSender ? 'Envió a:' : 'Recibió de:'}</span>
                          <span className="text-[9px] text-zinc-300">{isSender ? msg.receiver.username : msg.sender.username}</span>
                        </div>
                        <div className="group relative">
                          <div className={`p-2.5 rounded-lg text-xs leading-relaxed font-sans border shadow-md ${
                            isSender 
                              ? 'bg-cyan-950/30 border-cyan-900/50 text-cyan-50 rounded-tr-none' 
                              : 'bg-zinc-900 border-zinc-800 text-zinc-300 rounded-tl-none'
                          }`}>
                            {msg.message_text}
                          </div>
                          
                          {/* Botón Admin para borrar mensaje tóxico (solo hover) */}
                          <button 
                            onClick={() => deleteMessage(msg.id)}
                            className="absolute -top-2 -right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg cursor-pointer z-10"
                            title="Eliminar mensaje (Violación de Normas)"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                        <span className="text-[8px] text-zinc-600 mt-1">
                          {new Date(msg.created_at).toLocaleString()} {msg.is_read ? '• Leído' : ''}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        ) : (
          <div className="lg:col-span-2 bg-zinc-950/50 border border-zinc-900 border-dashed rounded-xl flex flex-col items-center justify-center p-12 text-center">
            <Eye size={32} className="text-zinc-800 mb-3" />
            <p className="text-zinc-500 text-xs font-sans max-w-sm">
              Selecciona un comandante de la red para desplegar su grafo de contactos y auditar sus transmisiones encriptadas.
            </p>
          </div>
        )}
      </div>

      {/* POP-UP: TARJETA DE PERFIL PÚBLICA (Como lo verán los jugadores) */}
      {showProfileCard && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-cyan-900/50 rounded-xl shadow-[0_0_40px_rgba(6,182,212,0.1)] w-full max-w-sm overflow-hidden relative font-sans">
            
            <button 
              onClick={() => setShowProfileCard(null)}
              className="absolute top-3 right-3 text-zinc-500 hover:text-white cursor-pointer z-10 bg-black/50 p-1 rounded-full"
            >
              <X size={16} />
            </button>

            {/* Cabecera del Perfil */}
            <div className="h-24 bg-gradient-to-b from-cyan-950/50 to-zinc-950 relative border-b border-zinc-900">
              <div className="absolute -bottom-8 left-6">
                <div className="h-16 w-16 rounded-lg bg-zinc-900 border-2 border-cyan-500 overflow-hidden flex items-center justify-center shadow-lg">
                  {showProfileCard.avatarUrl ? (
                    <img src={showProfileCard.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <Users size={24} className="text-cyan-500" />
                  )}
                </div>
              </div>
              <div className="absolute top-3 left-4">
                <span className="px-2 py-1 bg-black/60 border border-zinc-800 rounded text-[9px] font-mono text-zinc-300 uppercase tracking-widest backdrop-blur-sm">
                  Rango de Piloto
                </span>
              </div>
            </div>

            {/* Info Pública */}
            <div className="pt-10 pb-6 px-6 space-y-5 text-left">
              <div>
                <h3 className="text-xl font-black text-white font-mono uppercase truncate flex items-center gap-2">
                  {showProfileCard.username}
                  {showProfileCard.role === 'admin' && <Shield size={14} className="text-red-500" title="Administrador del Sistema" />}
                </h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Nivel de Flota: <strong className="text-cyan-400 font-mono text-sm">{showProfileCard.level}</strong>
                </p>
              </div>

              <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-900 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Afiliación:</span>
                  <span className="text-zinc-300 font-mono uppercase">{showProfileCard.faction || 'Piloto Libre'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Alineación Moral:</span>
                  <span className="text-zinc-300 font-mono uppercase">{showProfileCard.moral_status || 'Neutral'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Registro DGN:</span>
                  <span className="text-zinc-400 font-mono text-[10px]">{new Date(showProfileCard.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="pt-2">
                <button className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-not-allowed opacity-50 font-mono">
                  <MessageSquare size={14} /> Establecer Transmisión
                </button>
                <p className="text-[9px] text-center text-zinc-600 mt-2">
                  (Modo Admin: Botón Desactivado)
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminSocialCRM;
