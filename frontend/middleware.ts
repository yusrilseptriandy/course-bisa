import { Session, User } from 'better-auth/types';
import { NextRequest, NextResponse } from 'next/server';
import { betterFetch } from '@better-fetch/fetch';

export async function middleware(request: NextRequest) {
    const { nextUrl } = request;

    if (nextUrl.pathname.startsWith('/teacher')) {
        const { data: sessions } = await betterFetch<{
            session: Session;
            user: User & { role: string };
        }>('/api/auth/get-session', {
            baseURL: nextUrl.origin,
            headers: {
                cookie: request.headers.get('cookie') || '',
            },
        });

        if (!sessions || sessions.user.role !== 'teacher') {
            return NextResponse.redirect(new URL('/', request.url));
        }
    }
    console.log('middleware');
    return NextResponse.next();
}

export const config = {
    matcher: ['/teacher/:path*'],
};
