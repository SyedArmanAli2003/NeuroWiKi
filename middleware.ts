export { default } from 'next-auth/middleware'

export const config = {
  matcher: [
    /*
     * Protect all routes except:
     *  - /auth/* (sign-in page itself)
     *  - /api/auth/* (NextAuth API)
     *  - _next static files, images, favicon
     */
    '/((?!auth|api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
}
