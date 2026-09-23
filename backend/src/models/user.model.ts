import { Schema, model } from 'mongoose'

export type UserRole = 'user' | 'moderator' | 'admin'

export interface UserDocument {
  username: string
  email: string
  passwordHash: string
  profileImage?: string
  bio?: string
  role: UserRole
  twoFactorSecret?: string
  pendingTwoFactorSecret?: string
  twoFactorEnabled: boolean
  resetTokenHash?: string
  resetTokenExpiresAt?: Date
  createdAt: Date
  updatedAt: Date
  lastActiveAt?: Date
}

const userSchema = new Schema<UserDocument>(
  {
    username: { type: String, required: true, trim: true, minlength: 3, maxlength: 40 },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    profileImage: { type: String, trim: true, maxlength: 500 },
    bio: { type: String, trim: true, maxlength: 500 },
    role: { type: String, enum: ['user', 'moderator', 'admin'], default: 'user', required: true, index: true },
    twoFactorSecret: { type: String, select: false },
    pendingTwoFactorSecret: { type: String, select: false },
    lastActiveAt: { type: Date, default: Date.now, index: true },
    twoFactorEnabled: { type: Boolean, default: false, required: true },
    resetTokenHash: { type: String, select: false, index: true },
    resetTokenExpiresAt: { type: Date, select: false },
  },
  { timestamps: true },
)

userSchema.index({ username: 1 }, { unique: true })

export const UserModel = model<UserDocument>('User', userSchema)
