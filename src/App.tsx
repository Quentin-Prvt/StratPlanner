import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// --- PAGES ---
import { Dashboard } from './pages/Dashboard';
import { MapSelector } from './pages/MapSelector';
import { StrategyEditorPage } from './pages/StrategyEditorPage';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import {Header } from './components/Header';
import { Profile } from './pages/Profile';


const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-[#1f2326] text-white">
                Chargement...
            </div>
        );
    }

    if (!user) return <Navigate to="/login" />;
    return <>{children}</>;
};

// Gardien : Empêche l'accès au Login/Register si déjà connecté (Redirige vers Dashboard)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, loading } = useAuth();
    if (loading) return null;
    if (user) return <Navigate to="/" />;
    return <>{children}</>;
};

function App() {
    return (
        <AuthProvider>
            {/* Conteneur principal plein écran */}
            <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#1f2326]">
                <Header />

                <main className="flex-1 relative overflow-hidden">
                    <Routes>
                        {/* --- ROUTES PUBLIQUES (Auth) --- */}
                        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

                        {/* Redirection de l'ancienne route /auth vers /login */}
                        <Route path="/auth" element={<Navigate to="/login" />} />

                        {/* --- ROUTES PROTÉGÉES --- */}

                        {/*  Dashboard : Liste des dossiers et stratégies */}
                        <Route path="/" element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        } />
                        {/*  Profile : */}
                        <Route path="/profile" element={
                            <ProtectedRoute>
                                <Profile />
                            </ProtectedRoute>
                        } />

                        {/*  Création (Ancien Home) : Choix de la map */}
                        <Route path="/create" element={
                            <ProtectedRoute>
                                <MapSelector />
                            </ProtectedRoute>
                        } />

                        {/*  Éditeur : Modification de la stratégie */}
                        <Route path="/editor/:id" element={
                            <ProtectedRoute>
                                <StrategyEditorPage />
                            </ProtectedRoute>
                        } />

                        {/* Fallback : Si l'URL n'existe pas, retour au Dashboard */}
                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                </main>
            </div>
        </AuthProvider>
    );
}

export default App;