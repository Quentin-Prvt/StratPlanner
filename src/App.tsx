import { Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { StrategyEditorPage } from './pages/StrategyEditorPage';
import { Auth } from './pages/Auth';
import { Header } from './components/Header';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
    return (
        <AuthProvider>
            <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#1f2326]">

                {/* Le Header est dans le contexte Auth, donc il peut afficher l'user */}
                <Header />

                <main className="flex-1 relative overflow-hidden">
                    <Routes>
                        {/* Route Publique : Authentification */}
                        <Route path="/auth" element={<Auth />} />

                        {/* Route Protégée : Accueil */}
                        <Route path="/" element={
                            <ProtectedRoute>
                                <Home />
                            </ProtectedRoute>
                        } />

                        {/* Route Protégée : Éditeur */}
                        <Route path="/editor/:id" element={
                            <ProtectedRoute>
                                <StrategyEditorPage />
                            </ProtectedRoute>
                        } />
                    </Routes>
                </main>

            </div>
        </AuthProvider>
    );
}

export default App;