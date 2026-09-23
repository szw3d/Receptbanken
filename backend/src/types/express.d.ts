import type { UserRole } from '../models/user.model.js'

declare global {
  namespace Express {
    interface Request {
      authenticatedUser?: {
        id: string
        role: UserRole
        username: string
        email: string
        profileImage?: string
      }
    }
  }
}

export {}
