import { Router } from 'express'

import { requireAuth, requireRole } from '../middleware/auth.js'
import { createNewCategory, editCategory, findAllCategories, getCategory, removeCategory } from '../services/category.service.js'
import { categoryBodySchema, categoryIdSchema } from '../validation/category.validation.js'

export const categoryRouter = Router()

categoryRouter.get('/', async (_request, response, next) => {
  try {
    response.json({ success: true, data: await findAllCategories() })
  } catch (error) {
    next(error)
  }
})

categoryRouter.get('/:id', async (request, response, next) => {
  try {
    const { id } = categoryIdSchema.parse(request.params)
    response.json({ success: true, data: await getCategory(id) })
  } catch (error) {
    next(error)
  }
})

categoryRouter.post('/', requireAuth, requireRole('moderator'), async (request, response, next) => {
  try {
    const input = categoryBodySchema.parse(request.body)
    response.status(201).json({ success: true, data: await createNewCategory(input) })
  } catch (error) {
    next(error)
  }
})

categoryRouter.put('/:id', requireAuth, requireRole('moderator'), async (request, response, next) => {
  try {
    const { id } = categoryIdSchema.parse(request.params)
    const input = categoryBodySchema.partial().parse(request.body)
    response.json({ success: true, data: await editCategory(id, input) })
  } catch (error) {
    next(error)
  }
})

categoryRouter.delete('/:id', requireAuth, requireRole('moderator'), async (request, response, next) => {
  try {
    const { id } = categoryIdSchema.parse(request.params)
    await removeCategory(id)
    response.status(204).send()
  } catch (error) {
    next(error)
  }
})
