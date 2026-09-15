import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAuthPage = nextUrl.pathname.startsWith('/login') || nextUrl.pathname.startsWith('/register');
      const isPublicPage = nextUrl.pathname === '/';

      if (isAuthPage) {
        if (isLoggedIn) return Response.redirect(new URL('/dashboard', nextUrl));
        return true;
      }

      if (!isLoggedIn && !isPublicPage && !nextUrl.pathname.startsWith('/api')) {
        return Response.redirect(new URL('/login', nextUrl));
      }

      return true;
    },
  },
  providers: [], 
} satisfies NextAuthConfig;
