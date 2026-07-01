import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useRegisterMutation } from '../api/apiSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const Register: React.FC = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    const [register, { isLoading }] = useRegisterMutation();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await register({ username, email, password }).unwrap();
            alert('Регистрация успешна! Теперь войдите.');
            navigate('/login');
        } catch (err: any) {
            alert(err?.data?.message || 'Ошибка при регистрации');
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/40">
            <div className="w-full max-w-sm rounded-lg border bg-card p-6 shadow-sm">
                <div className="mb-6 text-center">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        Создать аккаунт
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Заполните данные для регистрации
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="username">Имя пользователя</Label>
                        <Input 
                            id="username" 
                            type="text" 
                            placeholder="IvanIvanov" 
                            value={username} 
                            onChange={(e) => setUsername(e.target.value)} 
                            required 
                        />
                    </div>

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
                        {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
                    </Button>
                </form>

                <div className="mt-4 text-center text-sm text-muted-foreground">
                    Уже есть аккаунт?{' '}
                    <Link to="/login" className="underline underline-offset-4 hover:text-primary">
                        Войти
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Register;