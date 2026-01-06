import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Map, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient.ts';

export const Header = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();

    // États locaux pour stocker les infos venant de la table 'profiles'
    const [displayName, setDisplayName] = useState<string>('Utilisateur');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    // On charge le profil depuis la DB à chaque fois que 'user' change
    useEffect(() => {
        const fetchProfile = async () => {
            if (!user) return;

            try {
                const { data } = await supabase
                    .from('profiles')
                    .select('username, avatar_url')
                    .eq('id', user.id)
                    .single();

                if (data) {
                    if (data.username) setDisplayName(data.username);
                    if (data.avatar_url) setAvatarUrl(data.avatar_url);
                } else {
                    // Fallback si pas de profil : email ou metadata
                    setDisplayName(user.user_metadata?.username || user.email || 'Utilisateur');
                }
            } catch (error) {
                console.error("Erreur chargement header:", error);
            }
        };

        fetchProfile();
    }, [user]);

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    return (
        <header className="h-14 bg-[#181b1e] border-b border-gray-800 flex items-center justify-between px-6 shrink-0 z-50">
            {/* LOGO */}
            <Link to="/" className="flex items-center gap-3 group">
                <div className="bg-blue-600 p-1.5 rounded-lg group-hover:bg-blue-500 transition-colors">
                    <Map className="text-white w-5 h-5" />
                </div>
                <span className="text-xl font-bold text-white tracking-wider group-hover:text-blue-400 transition-colors">
                    Strat Planner
                </span>
            </Link>

            {/* PARTIE DROITE */}
            <div className="flex items-center gap-6">
                {user ? (
                    <>
                        {/* LIEN PROFIL AVEC AVATAR */}
                        <Link
                            to="/profile"
                            className="flex items-center gap-3 hover:bg-gray-800 py-1 pl-1 pr-3 rounded-full transition-all group"
                            title="Voir mon profil"
                        >
                            {/* AVATAR : Image ou Initiale */}
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white uppercase border border-gray-700 overflow-hidden">
                                {avatarUrl ? (
                                    <img
                                        src={avatarUrl}
                                        alt="Profil"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    displayName[0]
                                )}
                            </div>

                            {/* Nom d'utilisateur */}
                            <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors hidden sm:block">
                                {displayName}
                            </span>
                        </Link>

                        <div className="h-6 w-px bg-gray-700" /> {/* Séparateur */}

                        {/* BOUTON DÉCONNEXION */}
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors text-sm font-medium"
                            title="Se déconnecter"
                        >
                            <LogOut size={18} />
                            <span className="hidden sm:inline">Déconnexion</span>
                        </button>
                    </>
                ) : (
                    <Link to="/login" className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                        Connexion
                    </Link>
                )}
            </div>
        </header>
    );
};