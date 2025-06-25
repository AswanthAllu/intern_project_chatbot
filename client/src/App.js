// client/src/App.js
import React, { useState, useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { CircularProgress } from '@mui/material';

import { ThemeProvider } from './context/ThemeContext';
import { ChatProvider } from './context/ChatContext'; // ✅ Import the new provider

// ... (Lazy load components and route helpers are unchanged)
const AuthPage = React.lazy(() => import('./components/AuthPage'));
const ChatPage = React.lazy(() => import('./components/ChatPage'));
const SettingsPage = React.lazy(() => import('./components/SettingsPage'));
const AdminPanel = React.lazy(() => import('./components/AdminPanel'));
const ProtectedRoute = ({ children }) => {
    const isAuthenticated = !!localStorage.getItem('userId');
    return isAuthenticated ? children : <Navigate to="/login" replace />;
};
const AdminRoute = ({ children }) => {
    const isAuthenticated = !!localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    return userRole === 'admin' ? children : <Navigate to="/chat" replace />;
};
const LoadingFallback = () => (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
    </div>
);


function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('userId'));

    useEffect(() => {
        const handleStorageChange = (event) => {
            if (event.key === 'userId') {
                setIsAuthenticated(!!event.newValue);
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    return (
        <ThemeProvider>
            {/* ✅ Wrap the entire router in the ChatProvider */}
            <ChatProvider>
                <Router>
                    <div className="app-container">
                        <Suspense fallback={<LoadingFallback />}>
                            <Routes>
                                <Route
                                    path="/login"
                                    element={
                                        !isAuthenticated ? (
                                            <AuthPage setIsAuthenticated={setIsAuthenticated} />
                                        ) : (
                                            <Navigate to="/chat" replace />
                                        )
                                    }
                                />
                                <Route
                                    path="/chat"
                                    element={
                                        <ProtectedRoute>
                                            <ChatPage setIsAuthenticated={setIsAuthenticated} />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/settings"
                                    element={
                                        <ProtectedRoute>
                                            <SettingsPage />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/admin"
                                    element={
                                        <AdminRoute>
                                            <AdminPanel />
                                        </AdminRoute>
                                    }
                                />
                                <Route
                                    path="/"
                                    element={<Navigate to={isAuthenticated ? "/chat" : "/login"} replace />}
                                />
                                <Route path="*" element={<Navigate to="/" replace />} />
                            </Routes>
                        </Suspense>
                    </div>
                </Router>
            </ChatProvider>
        </ThemeProvider>
    );
}

export default App;