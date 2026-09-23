import cors from 'cors'
import express from 'express'
import helmet from 'helmet'

import { env } from './config/env.js'
import { createSessionMiddleware } from './config/session.js'
import { errorHandler, notFoundHandler } from './middleware/error-handler.js'
import { authRouter } from './routes/auth.routes.js'
import { adminRouter } from './routes/admin.routes.js'
import { categoryRouter } from './routes/category.routes.js'
import { dashboardRouter } from './routes/dashboard.routes.js'
import { favoriteRouter } from './routes/favorite.routes.js'
import { healthRouter } from './routes/health.routes.js'
import { recipeRouter } from './routes/recipe.routes.js'
import { profileRouter } from './routes/profile.routes.js'
import { userRouter } from './routes/user.routes.js'
import { reviewRouter } from './routes/review.routes.js'
import { contactRouter } from './routes/contact.routes.js'
import { uploadDirectory, uploadRouter } from './routes/upload.routes.js'
import { accountRouter } from './routes/account.routes.js'
import { contentRouter } from './routes/content.routes.js'
import { activityRouter } from './routes/activity.routes.js'
import { publicStatsRouter } from './routes/public-stats.routes.js'

export const app = express()

app.disable('x-powered-by')
app.use(helmet())
app.use(cors({ origin: env.clientUrl, credentials: true }))
app.use(express.json({ limit: '1mb' }))
app.use(createSessionMiddleware())
app.use('/uploads', express.static(uploadDirectory))

app.get('/', (_request, response) => {
  response.json({ success: true, data: { name: 'Receptbanken API' } })
})
app.use('/api/health', healthRouter)
app.use('/api/stats', publicStatsRouter)
app.use('/api/auth', authRouter)
app.use('/api/admin', adminRouter)
app.use('/api/categories', categoryRouter)
app.use('/api/dashboard', dashboardRouter)
app.use('/api/recipes', recipeRouter)
app.use('/api/profile', profileRouter)
app.use('/api/users', userRouter)
app.use('/api', reviewRouter)
app.use('/api/contact', contactRouter)
app.use('/api/uploads', uploadRouter)
app.use('/api/account', accountRouter)
app.use('/api', contentRouter)
app.use('/api/admin/activity', activityRouter)
app.use('/api', favoriteRouter)
app.use(notFoundHandler)
app.use(errorHandler)
