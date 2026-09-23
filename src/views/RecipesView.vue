<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import RecipeCard from '../components/RecipeCard.vue'
import { useRecipeStore } from '../stores/recipe.store'
import { fetchCategories, type Category } from '../services/api'

const recipeStore = useRecipeStore()
const route = useRoute()
const filters = reactive({
  search: typeof route.query.search === 'string' ? route.query.search : '',
  category: typeof route.query.category === 'string' ? route.query.category : '',
  difficulty: typeof route.query.difficulty === 'string' ? route.query.difficulty : '',
  maxTime: typeof route.query.maxTime === 'string' ? route.query.maxTime : '',
  sort: typeof route.query.sort === 'string' ? route.query.sort : 'recommended',
})
const categories = ref<Category[]>([])
const currentPage = ref(1)
const recommendedRecipe = computed(() => recipeStore.result.items[0])
const remainingRecipes = computed(() => recipeStore.result.items.slice(1))

function loadRecipes() {
  return recipeStore.loadRecipes({
    search: filters.search,
    category: filters.category,
    difficulty: filters.difficulty as 'easy' | 'medium' | 'hard' | undefined,
    maxTime: filters.maxTime ? Number(filters.maxTime) : undefined,
    sort: filters.sort as 'newest' | 'oldest' | 'titleAsc' | 'titleDesc' | 'shortest' | 'longest' | 'popular' | 'recommended', page: currentPage.value,
  })
}

watch(filters, () => { currentPage.value = 1; void loadRecipes() })
watch(currentPage, loadRecipes)
onMounted(async () => { categories.value = await fetchCategories(); await loadRecipes() })
</script>

<template>
  <main class="catalog-page">
    <header class="page-heading">
      <div>
        <p class="eyebrow">Upptäck något nytt</p>
        <h1>Alla recept</h1>
      </div>
      <p>Smaker för vardag, helg och allt däremellan.</p>
    </header>

    <section class="filter-bar" aria-label="Filtrera recept">
      <label class="search-field"><span class="sr-only">Sök recept</span><input v-model="filters.search" type="search" placeholder="Sök efter recept, ingrediens..." /></label>
      <label><span class="sr-only">Kategori</span><select v-model="filters.category"><option value="">Alla kategorier</option><option v-for="category in categories" :key="category._id" :value="category._id">{{ category.name }}</option></select></label>
      <label><span class="sr-only">Svårighetsgrad</span><select v-model="filters.difficulty"><option value="">Alla nivåer</option><option value="easy">Enkel</option><option value="medium">Medel</option><option value="hard">Avancerad</option></select></label>
      <label><span class="sr-only">Maximal tid</span><select v-model="filters.maxTime"><option value="">All tid</option><option value="30">Under 30 min</option><option value="60">Under 60 min</option></select></label>
      <label><span class="sr-only">Sortering</span><select v-model="filters.sort"><option value="recommended">Rekommenderade</option><option value="popular">Populära</option><option value="newest">Senast tillagda</option><option value="shortest">Snabbast först</option><option value="titleAsc">A till Ö</option></select></label>
    </section>

    <p v-if="recipeStore.isLoading" class="state-message">Hämtar recept...</p>
    <p v-else-if="recipeStore.errorMessage" class="state-message state-message--error">{{ recipeStore.errorMessage }}</p>
    <p v-else-if="recipeStore.result.items.length === 0" class="state-message">Inga recept matchar din sökning ännu.</p>
    <template v-else>
      <section v-if="recommendedRecipe" class="mb-8 grid gap-6 overflow-hidden border border-[#c16e4b]/40 bg-[#26352f] p-5 text-[#f4f0e8] md:grid-cols-[1.1fr_.9fr] md:p-8" aria-label="Rekommenderat recept">
        <div class="flex min-h-64 flex-col justify-between"><div><span class="inline-flex rounded-full bg-[#c16e4b] px-3 py-1 text-xs font-bold uppercase tracking-[.14em]">Rekommenderad</span><p class="mt-8 text-xs font-bold uppercase tracking-[.14em] text-[#a9c5a4]">{{ recommendedRecipe.averageRating ? `${recommendedRecipe.averageRating.toFixed(1)} ★ · ${recommendedRecipe.reviewCount ?? 0} recensioner` : 'Ny favorit att upptäcka' }}</p><h2 class="mt-3 max-w-xl font-serif text-5xl leading-none md:text-7xl">{{ recommendedRecipe.title }}</h2><p class="mt-4 max-w-lg leading-7 text-[#b9c6be]">{{ recommendedRecipe.description }}</p></div><RouterLink class="mt-6 inline-flex w-fit items-center gap-3 font-bold text-[#f3b18d]" :to="`/recept/${recommendedRecipe._id}`">Visa recept <span aria-hidden="true">→</span></RouterLink></div>
        <div class="min-h-64 bg-[#d9e5d5] bg-cover bg-center" :style="(recommendedRecipe.images?.[0] || recommendedRecipe.image) ? { backgroundImage: `url(${recommendedRecipe.images?.[0] || recommendedRecipe.image})` } : undefined"></div>
      </section>
      <section class="recipe-grid" aria-live="polite">
        <RecipeCard v-for="recipe in remainingRecipes" :key="recipe._id" :recipe="recipe" />
      </section>
      <nav v-if="recipeStore.result.pagination.pages > 1" class="mt-10 flex items-center justify-center gap-3" aria-label="Paginering"><button class="rounded-full border border-[#26352f]/20 px-4 py-2 text-sm font-bold disabled:opacity-40" type="button" :disabled="currentPage === 1" @click="currentPage--">Föregående</button><span class="text-sm text-[#718078]">Sida {{ currentPage }} av {{ recipeStore.result.pagination.pages }}</span><button class="rounded-full border border-[#26352f]/20 px-4 py-2 text-sm font-bold disabled:opacity-40" type="button" :disabled="currentPage >= recipeStore.result.pagination.pages" @click="currentPage++">Nästa</button></nav>
    </template>
  </main>
</template>
