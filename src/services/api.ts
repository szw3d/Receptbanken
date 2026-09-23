import type { Recipe, RecipeQuery } from '../types/recipe'

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8001/api'

interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}
export interface AdminReport { _id: string; reason: string; createdAt: string; recipeId?: { title: string }; userId?: { username: string; email: string } }
export async function fetchAdminReports(): Promise<AdminReport[]> { const response = await fetch(`${apiBaseUrl}/admin/reports`, { credentials: 'include' }); const payload = (await response.json()) as ApiResponse<AdminReport[]>; if (!response.ok || !payload.success) throw new Error(payload.message ?? 'Kunde inte hämta rapporter.'); return payload.data }

export interface RecipeListResponse {
  items: Recipe[]
  pagination: { page: number; limit: number; total: number; pages: number }
}

export interface HomeStats {
  recipes: number
  users: number
  favorites: number
  averageRating: number
  reviewCount: number
}

export async function fetchHomeStats(): Promise<HomeStats> {
  const response = await fetch(`${apiBaseUrl}/stats`)
  const payload = (await response.json()) as ApiResponse<HomeStats>
  if (!response.ok || !payload.success) throw new Error(payload.message ?? 'Kunde inte hamta statistik.')
  return payload.data
}

export async function fetchRecipes(query: RecipeQuery = {}): Promise<RecipeListResponse> {
  const params = new URLSearchParams()
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.set(key, String(value))
  })

  const response = await fetch(`${apiBaseUrl}/recipes?${params.toString()}`, { credentials: 'include' })
  const payload = (await response.json()) as ApiResponse<RecipeListResponse>
  if (!response.ok || !payload.success) throw new Error(payload.message ?? 'Kunde inte hämta recept.')
  return payload.data
}

export async function fetchRecipe(recipeId: string): Promise<Recipe> {
  const response = await fetch(`${apiBaseUrl}/recipes/${recipeId}`, { credentials: 'include' })
  const payload = (await response.json()) as ApiResponse<Recipe>
  if (!response.ok || !payload.success) throw new Error(payload.message ?? 'Kunde inte hämta receptet.')
  return payload.data
}

export interface AuthUser {
  id: string
  username: string
  email: string
  role: 'user' | 'moderator' | 'admin'
  profileImage?: string
}
export type LoginResponse = AuthUser | { requiresTwoFactor: true }

async function postAuth<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${apiBaseUrl}/auth/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  })
  const payload = (await response.json()) as ApiResponse<T>
  if (!response.ok || !payload.success) throw new Error(payload.message ?? 'Något gick fel. Försök igen.')
  return payload.data
}

export function registerUser(input: { username: string; email: string; password: string }) {
  return postAuth<AuthUser>('register', input)
}

export function loginUser(input: { email: string; password: string; twoFactorToken?: string }) {
  return postAuth<LoginResponse>('login', input)
}

export async function setupTwoFactor() { return postAuth<{ secret: string; uri: string }>('2fa/setup') }
export async function enableTwoFactor(token: string): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/auth/2fa/enable`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ token }) })
  if (!response.ok) { const payload = (await response.json()) as ApiResponse<unknown>; throw new Error(payload.message ?? 'Kunde inte aktivera 2FA.') }
}
export async function disableTwoFactor(token: string): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/auth/2fa/disable`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ token }) })
  if (!response.ok) { const payload = (await response.json()) as ApiResponse<unknown>; throw new Error(payload.message ?? 'Kunde inte stänga av 2FA.') }
}
export async function requestPasswordReset(email: string) { return postAuth<unknown>('forgot-password', { email }) }
export async function resetPassword(token: string, password: string) { return postAuth<unknown>('reset-password', { token, password }) }

export async function getCurrentUser(): Promise<AuthUser> {
  const controller = new AbortController(); const timeout = window.setTimeout(() => controller.abort(), 4000)
  let response: Response
  try { response = await fetch(`${apiBaseUrl}/auth/me`, { credentials: 'include', signal: controller.signal }) } catch (error) { throw new Error(error instanceof DOMException && error.name === 'AbortError' ? 'Sesja wygasła lub API nie odpowiada.' : 'Kunde inte ansluta till API-servern.') } finally { window.clearTimeout(timeout) }
  const payload = (await response.json()) as ApiResponse<AuthUser>
  if (!response.ok || !payload.success) throw new Error(payload.message ?? 'Inte inloggad.')
  return payload.data
}

export async function logoutUser(): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  })

  if (!response.ok) {
    let message = 'Kunde inte logga ut.'
    try {
      const payload = (await response.json()) as ApiResponse<unknown>
      message = payload.message ?? message
    } catch {}
    throw new Error(message)
  }
}

export interface Category {
  _id: string
  name: string
}

export async function fetchCategories(): Promise<Category[]> {
  const response = await fetch(`${apiBaseUrl}/categories`)
  const payload = (await response.json()) as ApiResponse<Category[]>
  if (!response.ok || !payload.success) throw new Error(payload.message ?? 'Kunde inte hämta kategorier.')
  return payload.data
}

export async function createRecipe(input: Omit<Recipe, '_id' | 'authorId' | 'categoryId'> & { categoryId: string }) {
  const response = await fetch(`${apiBaseUrl}/recipes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  })
  const payload = (await response.json()) as ApiResponse<Recipe>
  if (!response.ok || !payload.success) throw new Error(payload.message ?? 'Kunde inte skapa receptet.')
  return payload.data
}

export async function updateRecipe(recipeId: string, input: Partial<Omit<Recipe, '_id' | 'authorId'>>): Promise<Recipe> {
  const response = await fetch(`${apiBaseUrl}/recipes/${recipeId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(input) })
  const payload = (await response.json()) as ApiResponse<Recipe>
  if (!response.ok || !payload.success) throw new Error(payload.message ?? 'Kunde inte uppdatera receptet.')
  return payload.data
}

export async function deleteRecipe(recipeId: string): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/recipes/${recipeId}`, { method: 'DELETE', credentials: 'include' })
  if (!response.ok) { const payload = (await response.json()) as ApiResponse<unknown>; throw new Error(payload.message ?? 'Kunde inte ta bort receptet.') }
}

export async function uploadImages(files: File[]): Promise<string[]> {
  const formData = new FormData()
  files.forEach((file) => formData.append('images', file))
  const response = await fetch(`${apiBaseUrl}/uploads/images`, { method: 'POST', credentials: 'include', body: formData })
  const payload = (await response.json()) as ApiResponse<{ urls: string[] }>
  if (!response.ok || !payload.success) throw new Error(payload.message ?? 'Kunde inte ladda upp bilderna.')
  return payload.data.urls
}

export async function fetchFavorites(userId: string): Promise<Array<{ recipeId: Recipe }>> {
  const response = await fetch(`${apiBaseUrl}/users/${userId}/favorites`, { credentials: 'include' })
  const payload = (await response.json()) as ApiResponse<Array<{ recipeId: Recipe }>>
  if (!response.ok || !payload.success) throw new Error(payload.message ?? 'Kunde inte hämta favoriter.')
  return payload.data
}

export async function addFavorite(userId: string, recipeId: string): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/users/${userId}/favorites/${recipeId}`, { method: 'POST', credentials: 'include' })
  const payload = (await response.json()) as ApiResponse<unknown>
  if (!response.ok || !payload.success) throw new Error(payload.message ?? 'Kunde inte spara receptet.')
}

export async function removeFavorite(userId: string, recipeId: string): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/users/${userId}/favorites/${recipeId}`, { method: 'DELETE', credentials: 'include' })
  if (!response.ok) {
    const payload = (await response.json()) as ApiResponse<unknown>
    throw new Error(payload.message ?? 'Kunde inte ta bort favoriten.')
  }
}

export interface PublicProfile { user: { _id: string; username: string; profileImage?: string; bio?: string; createdAt: string; isOnline: boolean }; recipes: Recipe[]; recipeCount: number; reviewCount: number }

export async function fetchPublicProfile(userId: string): Promise<PublicProfile> {
  const response = await fetch(`${apiBaseUrl}/users/${userId}`)
  const payload = (await response.json()) as ApiResponse<PublicProfile>
  if (!response.ok || !payload.success) throw new Error(payload.message ?? 'Kunde inte hämta profilen.')
  return payload.data
}

export interface DashboardData {
  user: AuthUser & { profileImage?: string; bio?: string; createdAt: string }
  stats: { recipeCount: number; favoriteCount: number }
  recentRecipes: Recipe[]
  recentFavorites: Array<{ recipeId: Recipe }>
}

export async function fetchDashboard(): Promise<DashboardData> {
  const controller = new AbortController(); const timeout = window.setTimeout(() => controller.abort(), 4000)
  let response: Response
  try { response = await fetch(`${apiBaseUrl}/dashboard`, { credentials: 'include', signal: controller.signal }) } catch (error) { throw new Error(error instanceof DOMException && error.name === 'AbortError' ? 'Dashboarden svarade inte i tid. Kontrollera att API-servern körs.' : 'Kunde inte ansluta till API-servern.') } finally { window.clearTimeout(timeout) }
  const payload = (await response.json()) as ApiResponse<DashboardData>
  if (!response.ok || !payload.success) throw new Error(payload.message ?? 'Kunde inte hämta dashboarden.')
  return payload.data
}

export interface ProfileData extends AuthUser {
  profileImage?: string
  bio?: string
  createdAt: string
  twoFactorEnabled?: boolean
}

export interface Review { _id: string; recipeId: string; userId: { _id: string; username: string; profileImage?: string }; rating: number; comment: string; createdAt: string }

export async function fetchReviews(recipeId: string): Promise<Review[]> {
  const response = await fetch(`${apiBaseUrl}/recipes/${recipeId}/reviews`)
  const payload = (await response.json()) as ApiResponse<Review[]>
  if (!response.ok || !payload.success) throw new Error(payload.message ?? 'Kunde inte hämta recensioner.')
  return payload.data
}

export async function saveReview(recipeId: string, rating: number, comment: string): Promise<Review> {
  const response = await fetch(`${apiBaseUrl}/recipes/${recipeId}/reviews`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ rating, comment }) })
  const payload = (await response.json()) as ApiResponse<Review>
  if (!response.ok || !payload.success) throw new Error(payload.message ?? 'Kunde inte spara recensionen.')
  return payload.data
}

export async function removeReview(reviewId: string): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/reviews/${reviewId}`, { method: 'DELETE', credentials: 'include' })
  if (!response.ok) throw new Error('Kunde inte ta bort recensionen.')
}

export async function sendContactMessage(input: { name: string; email: string; message: string }): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/contact`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) })
  const payload = (await response.json()) as ApiResponse<unknown>
  if (!response.ok || !payload.success) throw new Error(payload.message ?? 'Kunde inte skicka meddelandet.')
}

export async function fetchProfile(): Promise<ProfileData> {
  const response = await fetch(`${apiBaseUrl}/profile`, { credentials: 'include' })
  const payload = (await response.json()) as ApiResponse<ProfileData>
  if (!response.ok || !payload.success) throw new Error(payload.message ?? 'Kunde inte hämta profilen.')
  return payload.data
}

export async function updateProfile(input: { username: string; bio?: string; profileImage?: string }): Promise<ProfileData> {
  const response = await fetch(`${apiBaseUrl}/profile`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(input),
  })
  const payload = (await response.json()) as ApiResponse<ProfileData>
  if (!response.ok || !payload.success) throw new Error(payload.message ?? 'Kunde inte uppdatera profilen.')
  return payload.data
}

export async function updateAccount(input: { username: string; email: string; currentPassword: string; newPassword?: string }): Promise<AuthUser> {
  const response = await fetch(`${apiBaseUrl}/account`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(input) })
  const payload = (await response.json()) as ApiResponse<AuthUser>
  if (!response.ok || !payload.success) throw new Error(payload.message ?? 'Kunde inte uppdatera kontot.')
  return payload.data
}

export async function clearAccount(currentPassword: string): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/account/clear`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ currentPassword }) })
  if (!response.ok) { const payload = (await response.json()) as ApiResponse<unknown>; throw new Error(payload.message ?? 'Kunde inte rensa kontot.') }
}

export async function deleteAccount(currentPassword: string): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/account`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ currentPassword }) })
  if (!response.ok) { const payload = (await response.json()) as ApiResponse<unknown>; throw new Error(payload.message ?? 'Kunde inte ta bort kontot.') }
}

export async function fetchSimilarRecipes(recipeId: string): Promise<Recipe[]> { const response = await fetch(`${apiBaseUrl}/recipes/${recipeId}/similar`); const payload = (await response.json()) as ApiResponse<Recipe[]>; if (!response.ok || !payload.success) throw new Error(payload.message ?? 'Kunde inte hämta liknande recept.'); return payload.data }
export async function reportRecipe(recipeId: string, reason: string): Promise<void> { const response = await fetch(`${apiBaseUrl}/recipes/${recipeId}/reports`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ reason }) }); if (!response.ok) { const payload = (await response.json()) as ApiResponse<unknown>; throw new Error(payload.message ?? 'Kunde inte rapportera receptet.') } }

export interface ActivityLog { _id: string; action: string; entityType?: string; createdAt: string; userId?: { username: string; email: string } }
export async function fetchActivityLogs(): Promise<ActivityLog[]> { const response = await fetch(`${apiBaseUrl}/admin/activity`, { credentials: 'include' }); const payload = (await response.json()) as ApiResponse<ActivityLog[]>; if (!response.ok || !payload.success) throw new Error(payload.message ?? 'Kunde inte hämta aktivitetsloggen.'); return payload.data }

export interface AdminDashboardData {
  stats: { users: number; moderators: number; admins: number; recipes: number; categories: number; favorites: number; totalViews: number }
  recentUsers: Array<{ username: string; email: string; role: string; createdAt: string }>
  recentRecipes: Recipe[]
  mostViewedRecipes: Array<{ _id: string; title: string; views: number }>
}

export async function fetchAdminDashboard(): Promise<AdminDashboardData> {
  const response = await fetch(`${apiBaseUrl}/admin/dashboard`, { credentials: 'include' })
  const payload = (await response.json()) as ApiResponse<AdminDashboardData>
  if (!response.ok || !payload.success) throw new Error(payload.message ?? 'Kunde inte hämta adminpanelen.')
  return payload.data
}

export type UserRole = AuthUser['role']
export interface AdminUser { _id: string; username: string; email: string; role: UserRole; createdAt: string }

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  const response = await fetch(`${apiBaseUrl}/admin/users`, { credentials: 'include' })
  const payload = (await response.json()) as ApiResponse<AdminUser[]>
  if (!response.ok || !payload.success) throw new Error(payload.message ?? 'Kunde inte hämta användare.')
  return payload.data
}

export async function updateAdminUserRole(userId: string, role: UserRole): Promise<AdminUser> {
  const response = await fetch(`${apiBaseUrl}/admin/users/${userId}/role`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ role }) })
  const payload = (await response.json()) as ApiResponse<AdminUser>
  if (!response.ok || !payload.success) throw new Error(payload.message ?? 'Kunde inte uppdatera rollen.')
  return payload.data
}

export async function fetchAdminRecipes(): Promise<Recipe[]> {
  const response = await fetch(`${apiBaseUrl}/admin/recipes`, { credentials: 'include' })
  const payload = (await response.json()) as ApiResponse<Recipe[]>
  if (!response.ok || !payload.success) throw new Error(payload.message ?? 'Kunde inte hämta recept.')
  return payload.data
}

export async function createCategory(input: { name: string; description?: string; image?: string }): Promise<Category> {
  const response = await fetch(`${apiBaseUrl}/categories`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(input) })
  const payload = (await response.json()) as ApiResponse<Category>
  if (!response.ok || !payload.success) throw new Error(payload.message ?? 'Kunde inte skapa kategorin.')
  return payload.data
}

export async function updateCategory(id: string, input: { name: string; description?: string }): Promise<Category> {
  const response = await fetch(`${apiBaseUrl}/categories/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(input) })
  const payload = (await response.json()) as ApiResponse<Category>
  if (!response.ok || !payload.success) throw new Error(payload.message ?? 'Kunde inte uppdatera kategorin.')
  return payload.data
}

export async function deleteCategory(id: string): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/categories/${id}`, { method: 'DELETE', credentials: 'include' })
  if (!response.ok) { const payload = (await response.json()) as ApiResponse<unknown>; throw new Error(payload.message ?? 'Kunde inte ta bort kategorin.') }
}

async function deleteAdminResource(path: string, message: string) {
  const response = await fetch(`${apiBaseUrl}/admin/${path}`, { method: 'DELETE', credentials: 'include' })
  if (!response.ok) {
    const payload = (await response.json()) as ApiResponse<unknown>
    throw new Error(payload.message ?? message)
  }
}

export function deleteAdminUser(userId: string) { return deleteAdminResource(`users/${userId}`, 'Kunde inte ta bort användaren.') }
export function deleteAdminRecipe(recipeId: string) { return deleteAdminResource(`recipes/${recipeId}`, 'Kunde inte ta bort receptet.') }
