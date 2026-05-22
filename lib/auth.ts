import { getServerSession } from 'next-auth'
import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

const DEMO_USERS = [
  { id: '1', email: 'admin@neurowiki.ai', password: 'neurowiki2024', name: 'Admin' },
]

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email:    { label: 'Email',    type: 'email'    },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials: any) {
        if (!credentials?.email || !credentials?.password) return null
        const user = DEMO_USERS.find(
          (u) => u.email === credentials.email && u.password === credentials.password,
        )
        return user ? { id: user.id, email: user.email, name: user.name } : null
      },
    }),
  ],
  pages: { signIn: '/auth/signin' },
  session: { strategy: 'jwt' as const },
  secret: process.env.NEXTAUTH_SECRET ?? 'neurowiki-dev-secret-change-in-prod',
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) token.id = user.id
      return token
    },
    async session({ session, token }: any) {
      if (session.user) session.user.id = token.id
      return session
    },
  },
}

export const getSession = () => getServerSession(authOptions)
