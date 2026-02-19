import { Elysia } from 'elysia'
import { jwtVerify, createRemoteJWKSet } from 'jose'

const JWKS = createRemoteJWKSet(
  new URL('http://localhost:3000/api/auth/jwks')
)

export const authMiddleware = (app: Elysia) =>
  app.derive(async ({ request }) => {
    const authHeader = request.headers.get('Authorization')

    if (!authHeader?.startsWith('Bearer ')) {
      return { user: null }
    }

    const token = authHeader.split(' ')[1]
    if (!token) return { user: null }

    try {
      const { payload } = await jwtVerify(token, JWKS)

      return {
        user: {
          id: payload.sub as string,
          role: payload.role as string | undefined
        }
      }
    } catch (error) {
      console.error("JWT VERIFY ERROR:", error)
      return { user: null }
    }
  })
