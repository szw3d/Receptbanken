import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import CreateRecipeView from '../views/CreateRecipeView.vue'
import FavoritesView from '../views/FavoritesView.vue'
import DashboardView from '../views/DashboardView.vue'
import ProfileView from '../views/ProfileView.vue'
import AdminDashboardView from '../views/AdminDashboardView.vue'
import AdminManageView from '../views/AdminManageView.vue'
import { useAuthStore } from '../stores/auth.store'
import RecipeDetailsView from '../views/RecipeDetailsView.vue'
import EditRecipeView from '../views/EditRecipeView.vue'
import ForgotPasswordView from '../views/ForgotPasswordView.vue'
import ResetPasswordView from '../views/ResetPasswordView.vue'
import PublicProfileView from '../views/PublicProfileView.vue'
import RecipesView from '../views/RecipesView.vue'
import RegisterView from '../views/RegisterView.vue'
import AboutView from '../views/AboutView.vue'
import ContactView from '../views/ContactView.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomeView },
    { path: '/om-oss', component: AboutView },
    { path: '/kontakt', component: ContactView },
    { path: '/recept', component: RecipesView },
    { path: '/recept/:id', component: RecipeDetailsView },
    { path: '/recept/:id/redigera', component: EditRecipeView, meta: { requiresAuth: true } },
    { path: '/skapa-recept', component: CreateRecipeView, meta: { requiresAuth: true } },
    { path: '/favoriter', component: FavoritesView, meta: { requiresAuth: true } },
    { path: '/dashboard', component: DashboardView, meta: { requiresAuth: true } },
    { path: '/profil', component: ProfileView, meta: { requiresAuth: true } },
    { path: '/admin', component: AdminDashboardView, meta: { requiresAuth: true, requiresAdmin: true } },
    { path: '/admin/hantera', component: AdminManageView, meta: { requiresAuth: true, requiresAdmin: true } },
    { path: '/logga-in', component: LoginView },
    { path: '/registrera', component: RegisterView },
    { path: '/glomt-losenord', component: ForgotPasswordView },
    { path: '/aterstall-losenord', component: ResetPasswordView },
    { path: '/anvandare/:id', component: PublicProfileView },
  ],
})

router.beforeEach(async (to) => {
  if (!to.meta.requiresAuth) return true

  const authStore = useAuthStore()
  if (!authStore.initialized) await authStore.initialize()
  if (!authStore.user) return '/logga-in'
  if (to.meta.requiresAdmin && !['moderator', 'admin'].includes(authStore.user.role)) return '/dashboard'
  return true
})

router.afterEach((to) => { document.title = typeof to.meta.title === 'string' ? to.meta.title : to.path.startsWith('/recept') ? 'Recept | Receptbanken' : 'Receptbanken | Mat som känns hemma'; const description = document.querySelector('meta[name="description"]'); if (description) description.setAttribute('content', 'Upptäck, spara och dela recept som känns hemma.') })
