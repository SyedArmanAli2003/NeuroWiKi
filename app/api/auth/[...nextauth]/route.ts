import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

const DEMO_USERS = [
  { id: '1', email: 'admin@neurowiki.ai', password: 'neurowiki2024', name: 'Admin' },
]

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

        const user = DEMO_USERS.find(
          (u) =>
            u.email === credentials.email &&
            u.password === credentials.password,
        )

        if (user) {
          return { id: user.id, email: user.email, name: user.name }
        }
        return null
      },
    }),
  ],
  pages: {
    signIn: '/auth/signin',
  },
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET ?? 'neurowiki-dev-secret-change-in-prod',
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
