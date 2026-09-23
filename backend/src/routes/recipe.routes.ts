import { Router } from 'express'

import { isAdminRole, requireAuth } from '../middleware/auth.js'
import { AppError } from '../middleware/error-handler.js'
import { getRecipe, createRecipeForUser, deleteRecipeForUser, listRecipes, updateRecipeForUser } from '../services/recipe.service.js'
import { recipeBodySchema, recipeIdSchema, recipeQuerySchema } from '../validation/recipe.validation.js'

export const recipeRouter = Router()

recipeRouter.get('/', async (request, response, next) => {
  try {
    const query = recipeQuerySchema.parse(request.query)
    const data = await listRecipes(
      { search: query.search, categoryId: query.category, difficulty: query.difficulty, ingredient: query.ingredient, tag: query.tag, maxTime: query.maxTime },
      query.sort,
      query.page,
      query.limit,
    )
    response.json({ success: true, data })
  } catch (error) {
    next(error)
  }
})

recipeRouter.get('/:id', async (request, response, next) => {
  try {
    const { id } = recipeIdSchema.parse(request.params)
    response.json({ success: true, data: await getRecipe(id) })
  } catch (error) {
    next(error)
  }
})

recipeRouter.post('/', requireAuth, async (request, response, next) => {
  try {
    const input = recipeBodySchema.parse(request.body)
    if (!request.authenticatedUser) throw new AppError(401, 'Du måste vara inloggad.')
    const recipe = await createRecipeForUser(input, request.authenticatedUser.id)
    response.status(201).json({ success: true, data: recipe })
  } catch (error) {
    next(error)
  }
})

recipeRouter.put('/:id', requireAuth, async (request, response, next) => {
  try {
    const { id } = recipeIdSchema.parse(request.params)
    const input = recipeBodySchema.partial().parse(request.body)
    if (!request.authenticatedUser) throw new AppError(401, 'Du måste vara inloggad.')
    const recipe = await updateRecipeForUser(id, input, request.authenticatedUser.id, isAdminRole(request.authenticatedUser.role))
    response.json({ success: true, data: recipe })
  } catch (error) {
    next(error)
  }
})

recipeRouter.delete('/:id', requireAuth, async (request, response, next) => {
  try {
    const { id } = recipeIdSchema.parse(request.params)
    if (!request.authenticatedUser) throw new AppError(401, 'Du måste vara inloggad.')
    await deleteRecipeForUser(id, request.authenticatedUser.id, isAdminRole(request.authenticatedUser.role))
    response.status(204).send()
  } catch (error) {
    next(error)
  }
})
