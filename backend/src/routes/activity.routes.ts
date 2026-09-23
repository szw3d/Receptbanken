import { Router } from 'express'

import { requireAuth, requireRole } from '../middleware/auth.js'
import { listActivities } from '../services/activity-log.service.js'

export const activityRouter = Router()
activityRouter.get('/', requireAuth, requireRole('moderator'), async (_request, response, next) => {
  try { response.json({ success: true, data: await listActivities() }) } catch (error) { next(error) }
})
