import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLoginMutation } from '../api/apiSlice';
import { saveToken } from '../utils/token';
import { getSocket } from '../utils/socket';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    const [login, { isLoading }] = useLoginMutation();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await login({ email, password }).unwrap();
            saveToken(response.token);
            getSocket();
            navigate('/chats');
        } catch (err: any) {
            alert(err?.data?.message || 'Ошибка при входе');
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/40">
            <div className="w-full max-w-sm rounded-lg border bg-card p-6 shadow-sm">
                <div className="mb-6 text-center">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        Вход в WatchTogether
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Введите свои данные для продолжения
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input 
                            id="email"
                            type="email" 
                            placeholder="test@example.com" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            required 
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Пароль</Label>
                        <Input 
                            id="password"
                            type="password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            required 
                        />
                    </div>

                    <Button type="submit" disabled={isLoading} className="w-full">
                        {isLoading ? 'Вход...' : 'Войти'}
                    </Button>
                </form>

                <div className="mt-4 text-center text-sm text-muted-foreground">
                    Нет аккаунта?{' '}
                    <Link to="/register" className="underline underline-offset-4 hover:text-primary">
                        Зарегистрироваться
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Login;