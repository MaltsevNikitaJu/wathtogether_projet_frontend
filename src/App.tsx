import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { getToken } from './utils/token';
import { apiSlice } from './api/apiSlice';
import { getSocket } from './utils/socket';
import Login from './pages/Login';
import Register from './pages/Register';
import ChatList from './pages/ChatList';
import WatchRoom from './pages/WatchRoom';
import Friends from './pages/Friends';
import Profile from './pages/Profile';
import FriendRequests from './pages/FriendRequests';
import Subscription from './pages/Subscription';
import OAuthSuccess from './pages/OAuthSuccess';
import MyVideos from './pages/MyVideos';
import Catalog from './pages/Catalog';

type CacheTag = 'User' | 'Chats' | 'Friends' | 'ChatParticipants' | 'Videos';

const AppContent: React.FC = () => {
    const location = useLocation();
    const dispatch = useDispatch();
    const [isAuthenticated, setIsAuthenticated] = useState(!!getToken());

    useEffect(() => {
        setIsAuthenticated(!!getToken());
    }, [location]);

    useEffect(() => {
        if (!isAuthenticated) return;
        const socket = getSocket();
        const handler = (data: { tags?: string[] }) => {
            const tags = (data?.tags ?? []) as CacheTag[];
            if (tags.length) dispatch(apiSlice.util.invalidateTags(tags));
        };
        socket.on('cache_invalidated', handler);
        return () => {
            socket.off('cache_invalidated', handler);
        };
    }, [isAuthenticated, dispatch]);

    return (
        <>
            <Routes>
                <Route path="/register" element={isAuthenticated ? <Navigate to="/chats" /> : <Register />} />
                <Route path="/" element={isAuthenticated ? <Navigate to="/chats" /> : <Navigate to="/login" />} />
                <Route path="/login" element={isAuthenticated ? <Navigate to="/chats" /> : <Login />} />
                <Route path="/oauth/success" element={<OAuthSuccess />} />
                <Route path="/watch" element={isAuthenticated ? <WatchRoom /> : <Navigate to="/login" />} />
                <Route path="/chats" element={isAuthenticated ? <ChatList /> : <Navigate to="/login" />} />
                <Route path="/chats/:id" element={isAuthenticated ? <ChatList /> : <Navigate to="/login" />} />
                <Route path="/friends" element={isAuthenticated ? <Friends /> : <Navigate to="/login" />} />
                <Route path="/friends/requests" element={isAuthenticated ? <FriendRequests /> : <Navigate to="/login" />} />
                <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} />
                <Route path="/videos" element={isAuthenticated ? <MyVideos /> : <Navigate to="/login" />} />
                <Route path="/catalog" element={isAuthenticated ? <Catalog /> : <Navigate to="/login" />} />
                <Route path="/subscription" element={isAuthenticated ? <Subscription /> : <Navigate to="/login" />} />
            </Routes>
        </>
    );
};

const App: React.FC = () => {
    return (
        <div className="h-screen overflow-hidden">
            <AppContent />
        </div>
    );
};

export default App;
