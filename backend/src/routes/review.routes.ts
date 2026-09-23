import { Router } from 'express'

import { isAdminRole, requireAuth } from '../middleware/auth.js'
import { AppError } from '../middleware/error-handler.js'
import { RecipeModel } from '../models/recipe.model.js'
import { ReviewModel } from '../models/review.model.js'
import { reviewIdSchema, reviewSchema } from '../validation/review.validation.js'

export const reviewRouter = Router()

reviewRouter.get('/recipes/:recipeId/reviews', async (request, response, next) => {
  try {
    const { recipeId } = reviewIdSchema.parse(request.params)
    const reviews = await ReviewModel.find({ recipeId }).populate('userId', 'username profileImage').sort({ createdAt: -1 }).lean().exec()
    response.json({ success: true, data: reviews })
  } catch (error) { next(error) }
})

reviewRouter.post('/recipes/:recipeId/reviews', requireAuth, async (request, response, next) => {
  try {
    const { recipeId } = reviewIdSchema.parse(request.params)
    if (!await RecipeModel.exists({ _id: recipeId })) throw new AppError(404, 'Receptet kunde inte hittas.')
    const review = await ReviewModel.findOneAndUpdate({ recipeId, userId: request.authenticatedUser!.id }, { ...reviewSchema.parse(request.body), recipeId, userId: request.authenticatedUser!.id }, { upsert: true, returnDocument: 'after', runValidators: true, setDefaultsOnInsert: true }).populate('userId', 'username profileImage').lean().exec()
    response.status(201).json({ success: true, data: review })
  } catch (error) { next(error) }
})

reviewRouter.delete('/reviews/:id', requireAuth, async (request, response, next) => {
  try {
    const review = await ReviewModel.findById(request.params.id).lean().exec()
    if (!review) throw new AppError(404, 'Recensionen kunde inte hittas.')
    if (review.userId.toString() !== request.authenticatedUser!.id && !isAdminRole(request.authenticatedUser!.role)) throw new AppError(403, 'Du får bara ta bort din egen recension.')
    await ReviewModel.findByIdAndDelete(review._id).exec()
    response.status(204).send()
  } catch (error) { next(error) }
})
