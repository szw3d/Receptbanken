import { Router } from 'express'
import { Types } from 'mongoose'
import { z } from 'zod'

import { requireAuth, requireRole } from '../middleware/auth.js'
import { AppError } from '../middleware/error-handler.js'
import { RecipeModel } from '../models/recipe.model.js'
import { ReportModel } from '../models/report.model.js'

export const contentRouter = Router()
contentRouter.get('/recipes/:id/similar', async (request, response, next) => { try { const recipe = await RecipeModel.findById(request.params.id).lean().exec(); if (!recipe) throw new AppError(404, 'Receptet kunde inte hittas.'); const items = await RecipeModel.find({ _id: { $ne: recipe._id }, $or: [{ categoryId: recipe.categoryId }, { tags: { $in: recipe.tags } }] }).limit(4).sort({ createdAt: -1 }).populate('authorId', 'username').lean().exec(); response.json({ success: true, data: items }) } catch (error) { next(error) } })
contentRouter.post('/recipes/:id/reports', requireAuth, async (request, response, next) => { try { const input = z.object({ reason: z.string().trim().min(5).max(500) }).parse(request.body); const recipeId = request.params.id; if (typeof recipeId !== 'string' || !Types.ObjectId.isValid(recipeId)) throw new AppError(400, 'Ogiltigt recept-ID.'); const exists = await RecipeModel.exists({ _id: recipeId }); if (!exists) throw new AppError(404, 'Receptet kunde inte hittas.'); await ReportModel.create({ recipeId, userId: request.authenticatedUser!.id, reason: input.reason }); response.status(201).json({ success: true, message: 'Tack, rapporten har skickats.' }) } catch (error) { next(error) } })
contentRouter.get('/admin/reports', requireAuth, requireRole('moderator'), async (_request, response, next) => { try { const reports = await ReportModel.find({ status: 'open' }).populate('recipeId', 'title').populate('userId', 'username email').sort({ createdAt: -1 }).lean().exec(); response.json({ success: true, data: reports }) } catch (error) { next(error) } })
