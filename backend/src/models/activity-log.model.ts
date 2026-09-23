import { Schema, Types, model } from 'mongoose'

export type ActivityAction = 'auth.login' | 'auth.logout' | 'recipe.created' | 'recipe.updated' | 'recipe.deleted' | 'favorite.added' | 'favorite.removed' | 'review.created' | 'account.updated' | 'account.deleted' | 'admin.report.viewed' | 'admin.user.role.updated' | 'admin.user.deleted'

export interface ActivityLogDocument {
  userId?: Types.ObjectId
  action: ActivityAction
  entityType?: string
  entityId?: Types.ObjectId
  metadata?: Record<string, string>
  ipAddress?: string
  createdAt: Date
}

const activityLogSchema = new Schema<ActivityLogDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  action: { type: String, required: true, index: true },
  entityType: { type: String, trim: true },
  entityId: { type: Schema.Types.ObjectId, index: true },
  metadata: { type: Schema.Types.Mixed },
  ipAddress: { type: String, trim: true },
}, { timestamps: { createdAt: true, updatedAt: false } })

activityLogSchema.index({ createdAt: -1 })
export const ActivityLogModel = model<ActivityLogDocument>('ActivityLog', activityLogSchema)
