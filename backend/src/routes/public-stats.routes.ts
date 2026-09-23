import { Router } from 'express'

import { getPublicStats } from '../services/public-stats.service.js'

export const publicStatsRouter = Router()

publicStatsRouter.get('/', async (_request, response, next) => {
  try {
    response.json({ success: true, data: await getPublicStats() })
  } catch (error) {
    next(error)
  }
})
