import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { getToken } from './utils/token';
import { ToastProvider, useToast } from './hooks/useToast';
import { Toaster } from './components/ui/toaster';
import Login from './pages/Login';
import Register from './pages/Register';
import ChatList from './pages/ChatList';
import ChatRoom from './pages/ChatRoom';
import WatchRoom from './pages/WatchRoom';
import Friends from './pages/Friends';
import Profile from './pages/Profile';
import FriendRequests from './pages/FriendRequests';
import Subscription from './pages/Subscription';

const AppContent: React.FC = () => {
    const location = useLocation();
    const [isAuthenticated, setIsAuthenticated] = useState(!!getToken());
    const { toasts, removeToast } = useToast();

    useEffect(() => {
        setIsAuthenticated(!!getToken());
    }, [location]);

    return (
        <>
            <Routes>
                <Route path="/register" element={isAuthenticated ? <Navigate to="/chats" /> : <Register />} />
                <Route path="/" element={isAuthenticated ? <Navigate to="/chats" /> : <Navigate to="/login" />} />
                <Route path="/login" element={isAuthenticated ? <Navigate to="/chats" /> : <Login />} />
                <Route path="/watch" element={isAuthenticated ? <WatchRoom /> : <Navigate to="/login" />} />
                <Route path="/chats" element={isAuthenticated ? <ChatList /> : <Navigate to="/login" />} />
                <Route path="/chats/:id" element={isAuthenticated ? <ChatRoom /> : <Navigate to="/login" />} />
                <Route path="/friends" element={isAuthenticated ? <Friends /> : <Navigate to="/login" />} />
                <Route path="/friends/requests" element={isAuthenticated ? <FriendRequests /> : <Navigate to="/login" />} />
                <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} />
                <Route path="/subscription" element={isAuthenticated ? <Subscription /> : <Navigate to="/login" />} />
            </Routes>
            <Toaster toasts={toasts} onRemove={removeToast} />
        </>
    );
};

const App: React.FC = () => {
    return (
        <ToastProvider>
            <div className="h-screen overflow-hidden">
                <AppContent />
            </div>
        </ToastProvider>
    );
};

export default App;
