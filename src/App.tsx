import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// --- PAGES ---
import { Dashboard } from './pages/Dashboard';       // Nouvelle page d'accueil (Dossiers/Strats)
import { MapSelector } from './pages/MapSelector';   // Ancien Home.tsx (Choix de la map)
import { StrategyEditorPage } from './pages/StrategyEditorPage'; // Page qui contient EditorCanvas
import { Login } from './pages/Login';               // Page de connexion
import { Register } from './pages/Register';         // Page d'inscription
import {Header } from './components/Header';

// Gardien : Empêche l'accès aux pages protégées si non connecté
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

                        {/* 1. Dashboard : Liste des dossiers et stratégies */}
                        <Route path="/" element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        } />

                        {/* 2. Création (Ancien Home) : Choix de la map */}
                        <Route path="/create" element={
                            <ProtectedRoute>
                                <MapSelector />
                            </ProtectedRoute>
                        } />

                        {/* 3. Éditeur : Modification de la stratégie */}
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