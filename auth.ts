import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { db } from '@/src/prisma/db';

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  pages: { signIn: '/login' },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (
          typeof credentials.email !== 'string' ||
          typeof credentials.password !== 'string'
        ) {
          return null;
        }

        const email = credentials.email.trim().toLowerCase();
        if (!email || !credentials.password) {
          return null;
        }

        const user = await db.orm.public.User
          .select('id', 'email', 'name', 'password', 'preferredPaymentMethod')
          .where({ email })
          .first();

        if (!user || !(await bcrypt.compare(credentials.password, user.password))) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          preferredPaymentMethod: user.preferredPaymentMethod,
        };
      },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.preferredPaymentMethod = user.preferredPaymentMethod;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.preferredPaymentMethod = token.preferredPaymentMethod;
      }
      return session;
    },
  },
});
