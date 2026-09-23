import { Router } from 'express'
import { z } from 'zod'

import { requireAuth, requireRole } from '../middleware/auth.js'
import { AppError } from '../middleware/error-handler.js'
import { UserModel, type UserRole } from '../models/user.model.js'
import { deleteAdminRecipe, deleteAdminUser, getAdminDashboard, listAdminRecipes, listAdminUsers, updateAdminUserRole } from '../services/admin.service.js'
import { recordActivity } from '../services/activity-log.service.js'

export const adminRouter = Router()
adminRouter.use(requireAuth, requireRole('moderator'))

const roleSchema = z.object({ role: z.enum(['user', 'moderator', 'admin']) })
const protectedRoles: UserRole[] = ['moderator', 'admin']

adminRouter.get('/dashboard', async (_request, response, next) => {
  try { response.json({ success: true, data: await getAdminDashboard() }) } catch (error) { next(error) }
})

adminRouter.get('/users', async (_request, response, next) => {
  try { response.json({ success: true, data: await listAdminUsers() }) } catch (error) { next(error) }
})

adminRouter.get('/recipes', async (_request, response, next) => {
  try { response.json({ success: true, data: await listAdminRecipes() }) } catch (error) { next(error) }
})

adminRouter.patch('/users/:id/role', requireRole('admin'), async (request, response, next) => {
  try {
    const userId = z.string().parse(request.params.id)
    const { role } = roleSchema.parse(request.body)
    const targetUser = await UserModel.findById(userId).select('role').lean().exec()
    if (!targetUser) throw new AppError(404, 'Anvandaren kunde inte hittas.')
    if (userId === request.authenticatedUser?.id && role !== 'admin') throw new AppError(400, 'Du kan inte ta bort din egen admin-roll.')

    const updatedUser = await updateAdminUserRole(userId, role)
    if (!updatedUser) throw new AppError(404, 'Anvandaren kunde inte hittas.')
    await recordActivity({ request, userId: request.authenticatedUser?.id, action: 'admin.user.role.updated', entityType: 'user', entityId: userId, metadata: { role } })
    response.json({ success: true, data: updatedUser })
  } catch (error) { next(error) }
})

adminRouter.delete('/users/:id', async (request, response, next) => {
  try {
    const userId = z.string().parse(request.params.id)
    if (userId === request.authenticatedUser?.id) throw new AppError(400, 'Du kan inte ta bort ditt eget adminkonto.')
    const targetUser = await UserModel.findById(userId).select('role').lean().exec()
    if (!targetUser) throw new AppError(404, 'Anvandaren kunde inte hittas.')
    if (protectedRoles.includes(targetUser.role) && request.authenticatedUser?.role !== 'admin') throw new AppError(403, 'Endast admin kan ta bort moderator- och admin-konton.')
    await deleteAdminUser(userId)
    await recordActivity({ request, userId: request.authenticatedUser?.id, action: 'admin.user.deleted', entityType: 'user', entityId: userId })
    response.status(204).send()
  } catch (error) { next(error) }
})

adminRouter.delete('/recipes/:id', async (request, response, next) => {
  try { await deleteAdminRecipe(request.params.id); response.status(204).send() } catch (error) { next(error) }
})
