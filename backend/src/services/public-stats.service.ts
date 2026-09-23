import { FavoriteModel } from '../models/favorite.model.js'
import { RecipeModel } from '../models/recipe.model.js'
import { ReviewModel } from '../models/review.model.js'
import { UserModel } from '../models/user.model.js'

export async function getPublicStats() {
  const [recipes, users, favorites, ratingStats] = await Promise.all([
    RecipeModel.countDocuments().exec(),
    UserModel.countDocuments().exec(),
    FavoriteModel.countDocuments().exec(),
    ReviewModel.aggregate<{ _id: null; averageRating: number; reviewCount: number }>([
      { $group: { _id: null, averageRating: { $avg: '$rating' }, reviewCount: { $sum: 1 } } },
    ]).exec(),
  ])

  return {
    recipes,
    users,
    favorites,
    averageRating: ratingStats[0]?.averageRating ?? 0,
    reviewCount: ratingStats[0]?.reviewCount ?? 0,
  }
}
