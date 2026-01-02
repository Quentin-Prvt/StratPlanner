import { Link, useNavigate } from 'react-router-dom';
import { Map,  LogOut, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext'; // <--- Import

export const Header = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await signOut();
        navigate('/auth');
    };

    return (
        <header className="h-14 bg-[#181b1e] border-b border-gray-800 flex items-center justify-between px-6 shrink-0 z-50">
            <Link to="/" className="flex items-center gap-3 group">
                <div className="bg-blue-600 p-1.5 rounded-lg group-hover:bg-blue-500 transition-colors">
                    <Map className="text-white w-5 h-5" />
                </div>
                <span className="text-xl font-bold text-white tracking-wider group-hover:text-blue-400 transition-colors">
                    Strat Planner
                </span>
            </Link>

            <div className="flex items-center gap-6">
                {user ? (
                    <>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                            <User size={16} />
                            <span className="hidden sm:inline">{user.email}</span>
                        </div>

                        <div className="h-6 w-px bg-gray-700" /> {/* Séparateur */}

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
                    <Link to="/auth" className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                        Connexion
                    </Link>
                )}
            </div>
        </header>
    );
};