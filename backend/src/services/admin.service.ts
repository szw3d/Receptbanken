import { FavoriteModel } from '../models/favorite.model.js'
import { CategoryModel } from '../models/category.model.js'
import { RecipeModel } from '../models/recipe.model.js'
import { UserModel } from '../models/user.model.js'
import { ReviewModel } from '../models/review.model.js'
import { ReportModel } from '../models/report.model.js'
import type { UserRole } from '../models/user.model.js'

export async function getAdminDashboard() {
  const [users, moderators, admins, recipes, categories, favorites, totalViews, recentUsers, recentRecipes, mostViewedRecipes] = await Promise.all([
    UserModel.countDocuments().exec(),
    UserModel.countDocuments({ role: 'moderator' }).exec(),
    UserModel.countDocuments({ role: 'admin' }).exec(),
    RecipeModel.countDocuments().exec(),
    CategoryModel.countDocuments().exec(),
    FavoriteModel.countDocuments().exec(),
    RecipeModel.aggregate([{ $group: { _id: null, total: { $sum: '$views' } } }]).exec(),
    UserModel.find().select('username email role createdAt').sort({ createdAt: -1 }).limit(8).lean().exec(),
    RecipeModel.find().select('title difficulty authorId createdAt').populate('authorId', 'username').sort({ createdAt: -1 }).limit(8).lean().exec(),
    RecipeModel.find().select('title views').sort({ views: -1 }).limit(5).lean().exec(),
  ])

  return { stats: { users, moderators, admins, recipes, categories, favorites, totalViews: totalViews[0]?.total ?? 0 }, recentUsers, recentRecipes, mostViewedRecipes }
}

export function listAdminUsers() {
  return UserModel.find().select('username email role createdAt').sort({ createdAt: -1 }).lean().exec()
}

export function listAdminRecipes() {
  return RecipeModel.find().populate('authorId', 'username').populate('categoryId', 'name').sort({ createdAt: -1 }).lean().exec()
}

export async function deleteAdminUser(userId: string) {
  await FavoriteModel.deleteMany({ userId }).exec()
  await RecipeModel.deleteMany({ authorId: userId }).exec()
  await UserModel.findByIdAndDelete(userId).exec()
}

export async function updateAdminUserRole(userId: string, role: UserRole) {
  return UserModel.findByIdAndUpdate(userId, { role }, { returnDocument: 'after', runValidators: true })
    .select('username email role createdAt')
    .lean()
    .exec()
}

export async function deleteAdminRecipe(recipeId: string) {
  await FavoriteModel.deleteMany({ recipeId }).exec()
  await ReviewModel.deleteMany({ recipeId }).exec()
  await ReportModel.deleteMany({ recipeId }).exec()
  await RecipeModel.findByIdAndDelete(recipeId).exec()
}
