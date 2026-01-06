import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient.ts'; // Vérifie le chemin
import { useTeam, type TeamRole } from '../hooks/useTeam';
import {
    ArrowLeft, LogOut, Camera, Loader2, Shield, PlusCircle,
    Users, Trash2, Copy, Clipboard, Check // <--- Ajout de Check ici
} from 'lucide-react';

export const Profile = () => {
    const navigate = useNavigate();

    // --- ETATS UTILISATEUR ---
    const [user, setUser] = useState<any>(null);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [username, setUsername] = useState("");
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    // --- ETATS EQUIPE ---
    const {
        team, members, myRole, loading: teamLoading,
        createTeam, leaveTeam, updateMemberRole, kickMember,
        joinTeamByCode
    } = useTeam();

    const [isCreatingTeam, setIsCreatingTeam] = useState(false);
    const [newTeamName, setNewTeamName] = useState("");
    const [newTeamTag, setNewTeamTag] = useState("");
    const [joinCode, setJoinCode] = useState("");

    // --- ETAT NOTIFICATION (TOAST) ---
    const [showToast, setShowToast] = useState(false);

    // Chargement Profil
    useEffect(() => {
        const getProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { navigate('/login'); return; }
            setUser(user);

            try {
                const { data } = await supabase
                    .from('profiles')
                    .select('username, avatar_url')
                    .eq('id', user.id)
                    .single();

                if (data) {
                    setUsername(data.username || "Utilisateur");
                    setAvatarUrl(data.avatar_url);
                } else {
                    setUsername(user.email?.split('@')[0] || "Utilisateur");
                }
            } catch (error) { console.error(error); }
            finally { setLoadingProfile(false); }
        };
        getProfile();
    }, [navigate]);

    const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            if (!event.target.files || !event.target.files.length) return;
            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Math.random()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file);
            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);

            await supabase.from('profiles').update({ avatar_url: publicUrl, updated_at: new Date() }).eq('id', user.id);

            setAvatarUrl(publicUrl);
        } catch(e: any) { alert("Erreur upload: " + e.message) } finally { setUploading(false); }
    };

    const handleCreateTeam = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await createTeam(newTeamName, newTeamTag);
        if (res?.success) {
            setIsCreatingTeam(false);
            setNewTeamName("");
            setNewTeamTag("");
        } else {
            alert(res?.error || "Erreur création");
        }
    };

    const handleJoinTeam = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!joinCode.trim()) return;

        const res = await joinTeamByCode(joinCode.trim());
        if (res?.success) {
            alert("Équipe rejointe avec succès !"); // Tu pourras remplacer ça aussi plus tard
            setJoinCode("");
        } else {
            alert(res?.error || "Code invalide");
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    // --- FONCTION MODIFIÉE : COPIE + NOTIF ---
    const copyInviteCode = () => {
        if (team?.invite_code) {
            navigator.clipboard.writeText(team.invite_code);

            // Affiche la notification
            setShowToast(true);

            // La cache après 3 secondes
            setTimeout(() => {
                setShowToast(false);
            }, 3000);
        }
    };

    if (loadingProfile) return <div className="min-h-screen bg-[#121212] flex items-center justify-center text-white"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="min-h-screen bg-[#121212] text-white p-6 font-sans overflow-y-auto relative"> {/* Ajout de relative ici */}

            {/* --- NOTIFICATION TOAST --- */}
            {showToast && (
                <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
                    <div className="bg-green-600 text-white px-4 py-3 rounded-lg shadow-2xl flex items-center gap-3 border border-green-500">
                        <div className="bg-white/20 p-1 rounded-full">
                            <Check size={16} strokeWidth={3} />
                        </div>
                        <span className="font-bold text-sm">Code d'invitation copié !</span>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto pb-10">

                <button onClick={() => navigate('/')} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
                    <ArrowLeft size={20} /> Retour au Dashboard
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

                    {/* --- COLONNE GAUCHE : PROFIL --- */}
                    <div className="bg-[#1e2327] rounded-xl border border-gray-800 overflow-hidden shadow-2xl flex flex-col">
                        <div className="h-32 bg-gradient-to-r from-blue-900 to-slate-900 shrink-0"></div>
                        <div className="px-8 pb-8 flex-1 flex flex-col">
                            <div className="relative -top-12 mb-2 flex justify-between items-end">
                                <div className="relative group">
                                    <div className="w-24 h-24 bg-[#121212] rounded-full p-1.5 inline-block">
                                        {avatarUrl ?
                                            <img src={avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover border-2 border-blue-600"/>
                                            :
                                            <div className="w-full h-full bg-blue-600 rounded-full flex items-center justify-center text-3xl font-bold uppercase">{username?.[0] || 'U'}</div>
                                        }
                                    </div>
                                    <label className="absolute bottom-0 right-0 bg-gray-800 p-2 rounded-full cursor-pointer border border-gray-600 hover:bg-gray-700 transition-colors">
                                        {uploading ? <Loader2 size={16} className="animate-spin"/> : <Camera size={16}/>}
                                        <input type="file" className="hidden" accept="image/*" onChange={uploadAvatar} disabled={uploading}/>
                                    </label>
                                </div>
                            </div>

                            <h1 className="text-3xl font-bold -mt-10 mb-1">{username}</h1>
                            <p className="text-gray-400 mb-6">Membre de Strat Planner</p>

                            <button onClick={handleLogout} className="mt-auto border-t border-gray-800 pt-6 flex items-center gap-2 text-red-400 hover:text-red-300 w-full justify-center transition-colors"><LogOut size={20} /> Se déconnecter</button>
                        </div>
                    </div>

                    {/* --- COLONNE DROITE : ÉQUIPE --- */}
                    <div className="bg-[#1e2327] rounded-xl border border-gray-800 overflow-hidden shadow-2xl p-8 flex flex-col min-h-[600px]">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2 border-b border-gray-800 pb-4">
                            <Shield className="text-[#ff4655]" /> Gestion d'Équipe
                        </h2>

                        {teamLoading ? (
                            <div className="flex justify-center items-center h-40"><Loader2 className="animate-spin text-gray-500" /></div>
                        ) : team ? (
                            <div className="flex flex-col h-full animate-in fade-in">
                                {/* Header Équipe */}
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-16 h-16 bg-slate-800 rounded-lg flex items-center justify-center border-2 border-gray-700 shadow-lg shrink-0">
                                        <span className="text-xl font-black text-white tracking-widest">{team.tag}</span>
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-white leading-tight">{team.name}</h3>
                                        <span className={`text-[10px] px-2 py-0.5 rounded border uppercase font-bold tracking-wider inline-block mt-1 ${myRole === 'admin' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 'bg-blue-500/20 text-blue-400 border-blue-500/30'}`}>
                                            {myRole}
                                        </span>
                                    </div>
                                </div>

                                {/* LISTE DES MEMBRES */}
                                <div className="mb-6 flex-1 flex flex-col min-h-0">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-2"><Users size={14}/> Membres ({members.length})</h4>

                                    <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar flex-1 max-h-[300px]">
                                        {members.map(member => (
                                            <div key={member.id} className="flex items-center justify-between bg-[#121212] p-3 rounded-lg border border-gray-700">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold overflow-hidden">
                                                        {member.profile?.avatar_url ? (
                                                            <img src={member.profile.avatar_url} alt={member.profile.username} className="w-full h-full object-cover"/>
                                                        ) : (
                                                            member.profile?.username?.[0] || '?'
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-white">{member.profile?.username || 'Inconnu'}</div>
                                                        <div className={`text-[10px] uppercase font-bold ${member.role === 'admin' ? 'text-yellow-500' : 'text-gray-500'}`}>
                                                            {member.role}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Actions Admin */}
                                                {myRole === 'admin' && member.user_id !== user?.id && (
                                                    <div className="flex items-center gap-2">
                                                        <select
                                                            value={member.role}
                                                            onChange={(e) => updateMemberRole(member.id, e.target.value as TeamRole)}
                                                            className="bg-gray-800 text-[10px] text-white border border-gray-600 rounded px-1 py-1 outline-none cursor-pointer hover:border-gray-500"
                                                        >
                                                            <option value="admin">ADMIN</option>
                                                            <option value="coach">COACH</option>
                                                            <option value="player">JOUEUR</option>
                                                            <option value="guest">INVITÉ</option>
                                                        </select>
                                                        <button onClick={() => kickMember(member.id)} className="text-red-500 hover:bg-red-500/10 p-1.5 rounded" title="Exclure"><Trash2 size={14}/></button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* NOUVEAU SYSTÈME D'INVITATION (CODE) */}
                                {myRole === 'admin' && (
                                    <div className="mt-auto border-t border-gray-800 pt-6">
                                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-2">
                                            <Clipboard size={14}/> Code d'invitation
                                        </h4>
                                        <div className="bg-[#121212] p-4 rounded-lg border border-gray-700">
                                            <p className="text-xs text-gray-400 mb-2">Partagez ce code pour recruter des joueurs :</p>
                                            <div className="flex gap-2">
                                                <code className="flex-1 bg-black/50 p-3 rounded border border-gray-800 text-blue-400 font-mono text-sm tracking-widest text-center overflow-hidden">
                                                    {team.invite_code || "Chargement..."}
                                                </code>
                                                <button
                                                    onClick={copyInviteCode}
                                                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold transition-colors flex items-center gap-2 active:scale-95 transform"
                                                >
                                                    {showToast ? <Check size={16}/> : <Copy size={16}/>} Copier
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <button onClick={leaveTeam} className="mt-6 text-red-400 hover:text-red-300 text-sm flex items-center justify-center gap-2 w-full p-3 border border-red-900/30 rounded-lg hover:bg-red-900/10 transition-colors">
                                    <LogOut size={16} /> Quitter l'équipe
                                </button>
                            </div>
                        ) : (
                            // MODE SANS ÉQUIPE
                            !isCreatingTeam ? (
                                <div className="text-center py-8 flex flex-col justify-center items-center h-full">

                                    {/* Bloc CRÉATION */}
                                    <div className="mb-10 w-full max-w-xs">
                                        <div className="bg-gray-800 p-4 rounded-full mb-4 inline-block"><Shield size={32} className="text-gray-500" /></div>
                                        <h3 className="text-lg font-bold text-white mb-2">Créer une squad</h3>
                                        <p className="text-gray-400 text-xs mb-6">Devenez capitaine et invitez vos amis.</p>
                                        <button onClick={() => setIsCreatingTeam(true)} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 transition-all hover:scale-105">
                                            <PlusCircle size={20} /> Créer une équipe
                                        </button>
                                    </div>

                                    <div className="relative w-full max-w-xs mb-10">
                                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-800"></div></div>
                                        <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#1e2327] px-2 text-gray-500">OU</span></div>
                                    </div>

                                    {/* Bloc REJOINDRE */}
                                    <div className="w-full max-w-xs">
                                        <h3 className="text-sm font-bold text-white mb-3 text-left">Rejoindre via un code</h3>
                                        <form onSubmit={handleJoinTeam} className="flex gap-2">
                                            <input
                                                type="text"
                                                required
                                                placeholder="Collez le code ici..."
                                                className="flex-1 bg-[#121212] border border-gray-700 rounded-lg p-3 text-white text-sm outline-none focus:border-blue-500 transition-colors placeholder-gray-600 font-mono"
                                                value={joinCode}
                                                onChange={e => setJoinCode(e.target.value)}
                                            />
                                            <button type="submit" className="bg-gray-700 hover:bg-gray-600 text-white px-4 rounded-lg font-bold text-sm transition-colors border border-gray-600">
                                                Go
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            ) : (
                                // FORMULAIRE DE CRÉATION
                                <form onSubmit={handleCreateTeam} className="flex flex-col h-full animate-in fade-in slide-in-from-right-4">
                                    <h3 className="text-lg font-bold text-white mb-6">Nouvelle Équipe</h3>

                                    <div className="space-y-6 flex-1">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nom</label>
                                            <input type="text" required className="w-full bg-[#121212] border border-gray-600 rounded-lg p-3 text-white focus:border-blue-500 outline-none transition-colors" placeholder="Ex: Requiem Esports" value={newTeamName} onChange={e => setNewTeamName(e.target.value)}/>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Tag (2-4 char)</label>
                                            <input type="text" required minLength={2} maxLength={4} className="w-full bg-[#121212] border border-gray-600 rounded-lg p-3 text-white focus:border-blue-500 outline-none uppercase tracking-widest transition-colors" placeholder="RQM" value={newTeamTag} onChange={e => setNewTeamTag(e.target.value.toUpperCase())}/>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 mt-8">
                                        <button type="button" onClick={() => {setIsCreatingTeam(false);}} className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-medium transition-colors">Annuler</button>
                                        <button type="submit" className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-colors shadow-lg shadow-blue-900/20">Confirmer</button>
                                    </div>
                                </form>
                            )
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};