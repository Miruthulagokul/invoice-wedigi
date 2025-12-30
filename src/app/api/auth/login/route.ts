import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Simple authentication - in production use proper auth like NextAuth
const ADMIN_EMAIL = 'admin@wedigistudio.com';
const ADMIN_PASSWORD = 'wedigi2025';

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
            // Set session cookie
            const cookieStore = await cookies();
            cookieStore.set('auth_session', 'authenticated', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 7, // 1 week
                path: '/',
            });

            return NextResponse.json({
                success: true,
                user: {
                    id: '1',
                    email: ADMIN_EMAIL,
                    name: 'WeDigi Admin',
                },
            });
        }

        return NextResponse.json(
            { success: false, error: 'Invalid credentials' },
            { status: 401 }
        );
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { success: false, error: 'Login failed' },
            { status: 500 }
        );
    }
}
