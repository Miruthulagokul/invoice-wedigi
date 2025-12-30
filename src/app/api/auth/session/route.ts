import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const session = cookieStore.get('auth_session');

        if (session?.value === 'authenticated') {
            return NextResponse.json({
                authenticated: true,
                user: {
                    id: '1',
                    email: 'admin@wedigistudio.com',
                    name: 'WeDigi Admin',
                },
            });
        }

        return NextResponse.json({ authenticated: false });
    } catch (error) {
        console.error('Session check error:', error);
        return NextResponse.json({ authenticated: false });
    }
}
