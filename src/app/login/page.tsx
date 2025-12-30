'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Lock, Mail } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (data.success) {
                toast({
                    title: 'Welcome back!',
                    description: 'You have successfully logged in.',
                });
                router.push('/dashboard');
            } else {
                toast({
                    title: 'Login failed',
                    description: 'Invalid email or password. Please try again.',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Login error:', error);
            toast({
                title: 'Error',
                description: 'An error occurred. Please try again.',
                variant: 'destructive',
            });
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-md animate-fade-in">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-3 mb-4">
                        <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center shadow-lg">
                            <span className="text-primary-foreground font-bold text-2xl">W</span>
                        </div>
                        <div className="text-left">
                            <h1 className="text-2xl font-bold text-foreground">WeDigi</h1>
                            <p className="text-sm text-muted-foreground">Invoice Manager</p>
                        </div>
                    </div>
                </div>

                <Card className="border-border shadow-lg">
                    <CardHeader className="text-center pb-4">
                        <CardTitle className="text-xl">Welcome back</CardTitle>
                        <CardDescription>
                            Sign in to manage your invoices
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="admin@wedigistudio.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-10"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-10"
                                        required
                                    />
                                </div>
                            </div>

                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? 'Signing in...' : 'Sign in'}
                            </Button>
                        </form>

                        <div className="mt-6 p-4 bg-muted rounded-lg">
                            <p className="text-xs text-muted-foreground text-center">
                                <strong>Demo Credentials:</strong><br />
                                Email: admin@wedigistudio.com<br />
                                Password: wedigi2025
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
