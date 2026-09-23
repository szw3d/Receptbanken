<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { createCategory, deleteAdminRecipe, deleteAdminUser, deleteCategory, fetchAdminRecipes, fetchAdminUsers, fetchCategories, type AdminUser, type Category, updateAdminUserRole, updateCategory, type UserRole } from '../services/api'
import { useAuthStore } from '../stores/auth.store'
import type { Recipe } from '../types/recipe'

const users = ref<AdminUser[]>([])
const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()
const recipes = ref<Recipe[]>([])
const activeTab = ref<'users' | 'recipes' | 'categories'>((route.query.sektion as 'users' | 'recipes' | 'categories') || 'users')
const categories = ref<Category[]>([])
const categoryForm = ref({ name: '', description: '' })
const editingCategoryId = ref('')
const isLoading = ref(true)
const errorMessage = ref('')
const roleOptions: UserRole[] = ['user', 'moderator', 'admin']

async function load() {
  isLoading.value = true
  errorMessage.value = ''
  try { [users.value, recipes.value, categories.value] = await Promise.all([fetchAdminUsers(), fetchAdminRecipes(), fetchCategories()]) } catch (error) { errorMessage.value = error instanceof Error ? error.message : 'Kunde inte hämta admin-data.' } finally { isLoading.value = false }
}

async function removeUser(user: AdminUser) {
  if (!window.confirm(`Ta bort användaren ${user.username} och dess recept?`)) return
  try { await deleteAdminUser(user._id); users.value = users.value.filter((item) => item._id !== user._id) } catch (error) { errorMessage.value = error instanceof Error ? error.message : 'Kunde inte ta bort användaren.' }
}

async function changeUserRole(user: AdminUser, role: UserRole) {
  if (user.role === role) return
  try {
    const updatedUser = await updateAdminUserRole(user._id, role)
    users.value = users.value.map((item) => item._id === updatedUser._id ? updatedUser : item)
  } catch (error) { errorMessage.value = error instanceof Error ? error.message : 'Kunde inte uppdatera rollen.' }
}

function changeUserRoleFromEvent(user: AdminUser, event: Event) {
  const role = (event.target as HTMLSelectElement).value as UserRole
  void changeUserRole(user, role)
}

function canDeleteUser(user: AdminUser) {
  if (user._id === authStore.user?.id) return false
  if (user.role === 'moderator' || user.role === 'admin') return authStore.user?.role === 'admin'
  return true
}

async function removeRecipe(recipe: Recipe) {
  if (!window.confirm(`Ta bort receptet ${recipe.title}?`)) return
  try { await deleteAdminRecipe(recipe._id); recipes.value = recipes.value.filter((item) => item._id !== recipe._id) } catch (error) { errorMessage.value = error instanceof Error ? error.message : 'Kunde inte ta bort receptet.' }
}

function startCategoryEdit(category: Category) { editingCategoryId.value = category._id; categoryForm.value = { name: category.name, description: '' } }
function resetCategoryForm() { editingCategoryId.value = ''; categoryForm.value = { name: '', description: '' } }
async function saveCategory() {
  try {
    const category = editingCategoryId.value ? await updateCategory(editingCategoryId.value, categoryForm.value) : await createCategory(categoryForm.value)
    if (editingCategoryId.value) categories.value = categories.value.map((item) => item._id === category._id ? category : item)
    else categories.value.push(category)
    resetCategoryForm()
  } catch (error) { errorMessage.value = error instanceof Error ? error.message : 'Kunde inte spara kategorin.' }
}
async function removeCategoryItem(category: Category) {
  if (!window.confirm(`Ta bort kategorin ${category.name}?`)) return
  try { await deleteCategory(category._id); categories.value = categories.value.filter((item) => item._id !== category._id) } catch (error) { errorMessage.value = error instanceof Error ? error.message : 'Kunde inte ta bort kategorin.' }
}

onMounted(load)
function selectTab(tab: 'users' | 'recipes' | 'categories') { activeTab.value = tab; void router.replace({ query: { sektion: tab } }) }
</script>

<template>
  <main class="admin-page">
    <header class="page-heading"><div><p class="eyebrow">Administration</p><h1>Hantera</h1></div><RouterLink class="subtle-link" to="/admin">Till översikten →</RouterLink></header>
    <p v-if="isLoading" class="state-message">Hämtar data...</p>
    <p v-else-if="errorMessage" class="state-message state-message--error">{{ errorMessage }}</p>
    <template v-else>
      <div class="admin-tabs" role="tablist"><button :class="{ 'admin-tab--active': activeTab === 'users' }" type="button" role="tab" @click="selectTab('users')">Användare ({{ users.length }})</button><button :class="{ 'admin-tab--active': activeTab === 'recipes' }" type="button" role="tab" @click="selectTab('recipes')">Recept ({{ recipes.length }})</button><button :class="{ 'admin-tab--active': activeTab === 'categories' }" type="button" role="tab" @click="selectTab('categories')">Kategorier ({{ categories.length }})</button></div>
      <section v-if="activeTab === 'users'" class="admin-table-section"><div class="admin-table"><div v-for="user in users" :key="user.email" class="admin-row admin-row--managed"><div><strong>{{ user.username }}</strong><span>{{ user.email }}</span></div><select v-if="authStore.user?.role === 'admin'" :value="user.role" :disabled="user._id === authStore.user?.id" @change="changeUserRoleFromEvent(user, $event)"><option v-for="role in roleOptions" :key="role" :value="role">{{ role }}</option></select><small v-else>{{ user.role }}</small><button v-if="canDeleteUser(user)" class="danger-button" type="button" @click="removeUser(user)">Ta bort</button></div><p v-if="!users.length" class="empty-inline">Inga användare hittades.</p></div></section>
      <section v-else-if="activeTab === 'recipes'" class="admin-table-section"><div class="admin-table"><div v-for="recipe in recipes" :key="recipe._id" class="admin-row admin-row--managed"><div><strong>{{ recipe.title }}</strong><span>{{ typeof recipe.authorId === 'object' ? recipe.authorId.username : 'Okänd användare' }}</span></div><small>{{ recipe.difficulty }}</small><button class="danger-button" type="button" @click="removeRecipe(recipe)">Ta bort</button></div><p v-if="!recipes.length" class="empty-inline">Inga recept hittades.</p></div></section>
      <section v-if="activeTab === 'categories'" class="admin-table-section"><form class="category-form" @submit.prevent="saveCategory"><input v-model="categoryForm.name" required maxlength="60" placeholder="Kategorinamn" /><input v-model="categoryForm.description" maxlength="300" placeholder="Beskrivning" /><button class="button button--dark" type="submit">{{ editingCategoryId ? 'Spara' : 'Skapa' }}</button><button v-if="editingCategoryId" class="subtle-link category-cancel" type="button" @click="resetCategoryForm">Avbryt</button></form><div class="admin-table"><div v-for="category in categories" :key="category._id" class="admin-row admin-row--managed"><strong>{{ category.name }}</strong><span></span><div><button class="subtle-link category-action" type="button" @click="startCategoryEdit(category)">Redigera</button><button class="danger-button" type="button" @click="removeCategoryItem(category)">Ta bort</button></div></div></div></section>
    </template>
  </main>
</template>
