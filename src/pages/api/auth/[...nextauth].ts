import NextAuth, { type NextAuthOptions, type DefaultSession } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: DefaultSession['user'] & {
      id: string
      role: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
  }
}

interface AuthorizeUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

// Validate configuration on startup
if (!process.env.NEXTAUTH_SECRET) {
  console.error('❌ NEXTAUTH_SECRET is not set! Generate one with: openssl rand -base64 32');
  console.error('Add it to your environment variables: NEXTAUTH_SECRET=...');
}

if (!process.env.NEXTAUTH_URL) {
  console.error('❌ NEXTAUTH_URL is not set!');
  console.error('Set it to your application URL (e.g., https://zikiapparel.vercel.app or http://localhost:3000)');
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.warn('❌ Auth attempt: missing email or password');
            return null
          }

          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email
            }
          })

          if (!user) {
            console.warn(`❌ Auth attempt: user not found (${credentials.email})`);
            return null
          }

          if (!user.password) {
            console.warn(`❌ Auth attempt: user has no password (${credentials.email})`);
            return null
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isPasswordValid) {
            console.warn(`❌ Auth attempt: invalid password (${credentials.email})`);
            return null
          }

          console.log(`✅ Auth success: ${user.email} (role: ${user.role})`);
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          }
        } catch (error) {
          console.error('❌ Auth error:', error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jwt: async (params: any) => {
      try {
        const { token, user } = params;
        if (user) {
          token.role = user.role;
          token.id = user.id;
          console.log(`🔑 JWT token created for ${user.email} with role ${user.role}`);
        }
        return token;
      } catch (error) {
        console.error('❌ JWT callback error:', error);
        return params.token;
      }
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    session: async (params: any) => {
      try {
        const { session, token } = params;
        if (token && session.user) {
          session.user.id = token.id || token.sub;
          session.user.role = token.role as string;
          console.log(`📝 Session created for ${session.user.email} with role ${session.user.role}`);
        }
        return session;
      } catch (error) {
        console.error('❌ Session callback error:', error);
        return params.session;
      }
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
}

export default NextAuth(authOptions)