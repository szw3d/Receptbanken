<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { addFavorite, deleteRecipe, fetchFavorites, fetchRecipe, fetchReviews, fetchSimilarRecipes, removeFavorite, reportRecipe, saveReview, type Review } from '../services/api'
import { useAuthStore } from '../stores/auth.store'
import type { Recipe } from '../types/recipe'
import RecipeCard from '../components/RecipeCard.vue'
import { useToastStore } from '../stores/toast.store'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const toast = useToastStore()
const recipe = ref<Recipe | null>(null)
const isLoading = ref(true)
const errorMessage = ref('')
const favoriteState = ref(false)
const favoriteLoading = ref(false)
const reviews = ref<Review[]>([])
const reviewRating = ref(5)
const reviewComment = ref('')
const reviewLoading = ref(false)
const similarRecipes = ref<Recipe[]>([])
const reportReason = ref('')
const reportMessage = ref('')
const editingReviewId = ref('')
const activeImage = ref(0)
const images = () => recipe.value?.images?.length ? recipe.value.images : recipe.value?.image ? [recipe.value.image] : []
const ownReview = computed(() => reviews.value.find((review) => review.userId._id === authStore.user?.id))

onMounted(async () => {
  try {
    recipe.value = await fetchRecipe(String(route.params.id))
    if (authStore.user) {
      const favorites = await fetchFavorites(authStore.user.id)
      favoriteState.value = favorites.some((favorite) => favorite.recipeId._id === recipe.value?._id)
    }
    reviews.value = await fetchReviews(recipe.value._id)
    similarRecipes.value = await fetchSimilarRecipes(recipe.value._id)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Något gick fel. Försök igen.'
  } finally {
    isLoading.value = false
  }
})

async function toggleFavorite() {
  if (!authStore.user || !recipe.value) return
  favoriteLoading.value = true
  try {
    if (favoriteState.value) await removeFavorite(authStore.user.id, recipe.value._id)
    else await addFavorite(authStore.user.id, recipe.value._id)
    favoriteState.value = !favoriteState.value
    toast.show(favoriteState.value ? 'Receptet sparades i favoriter.' : 'Receptet togs bort från favoriter.')
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Kunde inte uppdatera favoriten.'
  } finally {
    favoriteLoading.value = false
  }
}

async function submitReport() { if (!recipe.value || !reportReason.value) return; try { await reportRecipe(recipe.value._id, reportReason.value); reportMessage.value = 'Rapporten har skickats.'; reportReason.value = '' } catch (error) { reportMessage.value = error instanceof Error ? error.message : 'Kunde inte skicka rapporten.' } }

async function submitReview() {
  if (!recipe.value) return
  reviewLoading.value = true
  try { const review = await saveReview(recipe.value._id, reviewRating.value, reviewComment.value); reviews.value = [review, ...reviews.value.filter((item) => item.userId._id !== authStore.user?.id)]; reviewComment.value = '' } catch (error) { errorMessage.value = error instanceof Error ? error.message : 'Kunde inte spara recensionen.' } finally { reviewLoading.value = false }
}

function editOwnReview() { if (ownReview.value) { editingReviewId.value = ownReview.value._id; reviewRating.value = ownReview.value.rating; reviewComment.value = ownReview.value.comment } }

async function removeRecipe() {
  if (!recipe.value || !window.confirm('Ta bort receptet permanent?')) return
  try { await deleteRecipe(recipe.value._id); toast.show('Receptet har tagits bort.'); await router.replace('/recept') } catch (error) { errorMessage.value = error instanceof Error ? error.message : 'Kunde inte ta bort receptet.' }
}

function changeImage(direction: number) {
  const count = images().length
  if (!count) return
  activeImage.value = (activeImage.value + direction + count) % count
}
</script>

<template>
  <main class="details-page">
    <RouterLink class="back-link" to="/recept">← Till alla recept</RouterLink>
    <p v-if="isLoading" class="state-message">Hämtar recept...</p>
    <p v-else-if="errorMessage" class="state-message state-message--error">{{ errorMessage }}</p>
    <article v-else-if="recipe" class="recipe-details">
      <div class="recipe-details__gallery"><div v-if="images().length" class="gallery-stage"><img :src="images()[activeImage]" :alt="`${recipe.title}, bild ${activeImage + 1}`" /><button v-if="images().length > 1" class="gallery-arrow gallery-arrow--prev" type="button" aria-label="Föregående bild" @click="changeImage(-1)">‹</button><button v-if="images().length > 1" class="gallery-arrow gallery-arrow--next" type="button" aria-label="Nästa bild" @click="changeImage(1)">›</button></div><div v-else class="recipe-details__visual"></div><div v-if="images().length > 1" class="gallery-thumbs"><button v-for="(image, index) in images()" :key="image" :class="{ 'gallery-thumb--active': activeImage === index }" type="button" @click="activeImage = index"><img :src="image" :alt="`Visa bild ${index + 1}`" /></button></div></div>
      <div class="recipe-details__content">
        <p class="eyebrow">{{ recipe.cookTime + recipe.prepTime }} minuter · {{ recipe.servings }} portioner</p>
        <h1>{{ recipe.title }}</h1>
        <p class="recipe-details__description">{{ recipe.description }}</p>
        <p class="recipe-author">Av <RouterLink v-if="typeof recipe.authorId === 'object'" :to="`/anvandare/${recipe.authorId._id}`"><strong>{{ recipe.authorId.username }}</strong></RouterLink><strong v-else>Receptbankens medlem</strong></p>
        <div class="details-actions">
          <button v-if="authStore.user" class="button button--dark" type="button" :disabled="favoriteLoading" @click="toggleFavorite">{{ favoriteState ? 'Sparad som favorit' : 'Spara som favorit' }} <span aria-hidden="true">{{ favoriteState ? '♥' : '♡' }}</span></button>
          <RouterLink v-else class="subtle-link" to="/logga-in">Logga in för att spara receptet</RouterLink>
          <RouterLink v-if="authStore.user && ((typeof recipe.authorId === 'string' ? recipe.authorId : recipe.authorId?._id) === authStore.user.id || ['moderator', 'admin'].includes(authStore.user.role))" class="subtle-link" :to="`/recept/${recipe._id}/redigera`">Redigera recept</RouterLink>
          <button v-if="authStore.user && ((typeof recipe.authorId === 'string' ? recipe.authorId : recipe.authorId?._id) === authStore.user.id || ['moderator', 'admin'].includes(authStore.user.role))" class="danger-button" type="button" @click="removeRecipe">Ta bort recept</button>
        </div>
        <div class="recipe-details__columns">
          <section>
            <h2>Ingredienser</h2>
            <ul class="ingredient-list">
              <li v-for="ingredient in recipe.ingredients" :key="`${ingredient.amount}-${ingredient.name}`"><strong>{{ ingredient.amount }}</strong> {{ ingredient.name }}</li>
            </ul>
          </section>
          <section>
            <h2>Gör så här</h2>
            <ol class="instruction-list">
              <li v-for="instruction in recipe.instructions" :key="instruction.step"><span>{{ instruction.step }}</span>{{ instruction.text }}</li>
            </ol>
          </section>
        </div>
        <section class="reviews-section"><div class="section-title"><div><p class="eyebrow">Gemenskapen</p><h2>Recensioner</h2></div><span v-if="reviews.length" class="review-count">{{ reviews.length }} st</span></div><form v-if="authStore.user" class="review-form" @submit.prevent="submitReview"><label>Betyg<select v-model.number="reviewRating"><option :value="5">★★★★★</option><option :value="4">★★★★☆</option><option :value="3">★★★☆☆</option><option :value="2">★★☆☆☆</option><option :value="1">★☆☆☆☆</option></select></label><label>Din recension<textarea v-model="reviewComment" required maxlength="1000" rows="3" placeholder="Vad tyckte du?"></textarea></label><button class="button button--dark" type="submit" :disabled="reviewLoading">{{ reviewLoading ? 'Sparar...' : (editingReviewId ? 'Spara ändring' : 'Publicera recension') }}</button></form><p v-else class="subtle-link">Logga in för att skriva en recension.</p><div class="review-list"><article v-for="review in reviews" :key="review._id" class="review-item"><div><strong>{{ review.userId.username }}</strong><span class="review-stars">{{ '★'.repeat(review.rating) }}{{ '☆'.repeat(5 - review.rating) }}</span><button v-if="review.userId._id === authStore.user?.id" class="subtle-link review-edit" type="button" @click="editOwnReview">Redigera</button></div><p>{{ review.comment }}</p></article><p v-if="!reviews.length" class="empty-inline">Ingen recension ännu. Bli först med att skriva en.</p></div></section>
        <section v-if="similarRecipes.length" class="mt-12"><p class="eyebrow">Du kanske också gillar</p><h2 class="mb-6 font-serif text-4xl text-[#26352f]">Liknande recept</h2><div class="recipe-grid"><RecipeCard v-for="similar in similarRecipes" :key="similar._id" :recipe="similar" /></div></section>
        <section v-if="authStore.user" class="mt-10 border-t border-[#26352f]/15 pt-6"><p class="eyebrow">Moderering</p><h2 class="font-serif text-2xl">Rapportera recept</h2><form class="mt-4 flex flex-wrap gap-3" @submit.prevent="submitReport"><input v-model="reportReason" required minlength="5" maxlength="500" class="border border-[#26352f]/20 bg-transparent p-3" placeholder="Vad är problemet?" /><button class="danger-button" type="submit">Skicka rapport</button></form><p v-if="reportMessage" class="mt-2 text-sm text-[#718078]">{{ reportMessage }}</p></section>
      </div>
    </article>
  </main>
</template>
