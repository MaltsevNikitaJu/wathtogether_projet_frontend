import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { getToken } from './utils/token';
import Login from './pages/Login';
import Register from './pages/Register';
import ChatList from './pages/ChatList';
import ChatRoom from './pages/ChatRoom';
import WatchRoom from './pages/WatchRoom';

const App: React.FC = () => {
    const location = useLocation();
    const [isAuthenticated, setIsAuthenticated] = useState(!!getToken());

    useEffect(() => {
        setIsAuthenticated(!!getToken());
    }, [location]);

    return (
        <div>
            <Routes>
                <Route path="/register" element={isAuthenticated ? <Navigate to="/chats" /> : <Register />} />
                <Route path="/" element={isAuthenticated ? <Navigate to="/chats" /> : <Navigate to="/login" />} />
                <Route path="/login" element={isAuthenticated ? <Navigate to="/chats" /> : <Login />} />
                <Route path="/watch" element={isAuthenticated ? <WatchRoom /> : <Navigate to="/login" />} />
                <Route path="/chats" element={isAuthenticated ? <ChatList /> : <Navigate to="/login" />} />
                <Route path="/chats/:id" element={isAuthenticated ? <ChatRoom /> : <Navigate to="/login" />} />
            </Routes>
        </div>
    );
};

export default App;
