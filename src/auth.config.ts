import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAuthPage = nextUrl.pathname === '/' || nextUrl.pathname.startsWith('/login') || nextUrl.pathname.startsWith('/register');

      if (isAuthPage) {
        if (isLoggedIn) return Response.redirect(new URL('/dashboard', nextUrl));
        return true;
      }

      if (!isLoggedIn && !nextUrl.pathname.startsWith('/api')) {
        return Response.redirect(new URL('/', nextUrl));
      }

      return true;
    },
  },
  providers: [], 
} satisfies NextAuthConfig;
