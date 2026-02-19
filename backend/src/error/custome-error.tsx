import { Elysia } from 'elysia'

import { errors as JoseErrors } from 'jose'
import { PrismaClientKnownRequestError } from '../../generated/prisma/internal/prismaNamespace'

export const errorHandler = new Elysia().onError(
  ({ error, set, code }) => {

    console.error("🔥 SERVER ERROR:", error)

    if (error instanceof PrismaClientKnownRequestError) {

      if (error.code === 'P2002') {
        set.status = 409
        return {
          success: false,
          message: 'Data already exists',
          code: 'DUPLICATE_DATA'
        }
      }

      if (error.code === 'P2025') {
        set.status = 404
        return {
          success: false,
          message: 'Data not found',
          code: 'NOT_FOUND'
        }
      }

      set.status = 400
      return {
        success: false,
        message: 'Database error',
        code: error.code
      }
    }

    if (error instanceof JoseErrors.JOSEError) {
      set.status = 401
      return {
        success: false,
        message: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      }
    }

    if (code === 'VALIDATION') {
      set.status = 422
      return {
        success: false,
        message: 'Validation error',
        code: 'VALIDATION_ERROR'
      }
    }

    set.status = 500
    return {
      success: false,
      message: 'Internal Server Error',
      code: 'INTERNAL_ERROR'
    }
  }
)
