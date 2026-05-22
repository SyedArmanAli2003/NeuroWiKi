import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { getUserByEmail, verifyPassword } from '@/lib/user-db'

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email:    { label: 'Email',    type: 'email'    },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = getUserByEmail(credentials.email)
        if (!user) return null

        const valid = await verifyPassword(credentials.password, user.password)
        if (!valid) return null

        return { id: String(user.id), email: user.email, name: user.name }
      },
    }),
  ],
  pages:   { signIn: '/auth/signin' },
  session: { strategy: 'jwt' },
  secret:  process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    async session({ session, token }) {
      if (session.user) (session.user as any).id = token.id
      return session
    },
  },
})

export { handler as GET, handler as POST }
