<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import RecipeCard from '../components/RecipeCard.vue'
import { fetchHomeStats, type HomeStats } from '../services/api'
import { useRecipeStore } from '../stores/recipe.store'

const recipeStore = useRecipeStore()
const homeRoot = ref<HTMLElement | null>(null)
const stats = ref<HomeStats | null>(null)
const statsError = ref('')
const latestRecipes = computed(() => recipeStore.result.items.slice(0, 3))
const featuredRecipe = computed(() => recipeStore.result.items[0])
let animationContext: gsap.Context | undefined

function formatCount(value = 0) {
  return new Intl.NumberFormat('sv-SE', { notation: value >= 1000 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(value)
}

function setupAnimations() {
  if (!homeRoot.value || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  gsap.registerPlugin(ScrollTrigger)

  animationContext = gsap.context(() => {
    gsap.from('[data-hero-reveal]', { y: 26, opacity: 0, duration: .9, ease: 'power3.out', stagger: .08 })
    gsap.from('.home-featured', { y: 36, rotate: 1.4, opacity: 0, duration: 1, ease: 'power3.out', delay: .15 })
    gsap.to('.home-featured__image', {
      backgroundPosition: '50% 64%',
      ease: 'none',
      scrollTrigger: { trigger: '.hero-section--home', start: 'top top', end: 'bottom top', scrub: true },
    })

    gsap.utils.toArray<HTMLElement>('[data-scroll-reveal]').forEach((element) => {
      gsap.from(element, {
        y: 46,
        opacity: 0,
        duration: .85,
        ease: 'power3.out',
        scrollTrigger: { trigger: element, start: 'top 82%' },
      })
    })

    gsap.utils.toArray<HTMLElement>('[data-stagger]').forEach((group) => {
      gsap.from(group.children, {
        y: 34,
        opacity: 0,
        duration: .75,
        ease: 'power3.out',
        stagger: .09,
        scrollTrigger: { trigger: group, start: 'top 82%' },
      })
    })

    gsap.from('.site-footer', {
      y: 34,
      opacity: 0,
      duration: .8,
      ease: 'power3.out',
      scrollTrigger: { trigger: '.site-footer', start: 'top 92%' },
    })
  }, homeRoot.value)
}

onMounted(async () => {
  await Promise.all([
    recipeStore.loadRecipes({ sort: 'recommended', limit: 4 }),
    fetchHomeStats().then((data) => { stats.value = data }).catch(() => { statsError.value = 'Statistik kunde inte hamtas.' }),
  ])
  await nextTick()
  setupAnimations()
})

onBeforeUnmount(() => {
  animationContext?.revert()
})
</script>

<template>
  <main ref="homeRoot" class="home-page">
    <section class="hero-section hero-section--home">
      <div class="hero-content">
        <p class="hero-kicker" data-hero-reveal>Ett smartare satt att spara matgladje</p>
        <h1 class="hero-title" data-hero-reveal>Receptbanken</h1>
        <p class="hero-lede" data-hero-reveal>Samla favoriter, hitta nasta vardagsmiddag och lat de basta recepten flyta upp nar du behover inspiration.</p>
        <div class="hero-actions" data-hero-reveal>
          <RouterLink class="button button--dark" to="/recept">Utforska recepten <span aria-hidden="true">-></span></RouterLink>
          <RouterLink class="button button--outline" to="/registrera">Skapa konto</RouterLink>
        </div>
        <dl class="hero-stats" aria-label="Statistik" data-hero-reveal>
          <div><dt>{{ formatCount(stats?.recipes) }}</dt><dd>publicerade recept</dd></div>
          <div><dt>{{ stats?.averageRating ? stats.averageRating.toFixed(1) : '0.0' }}★</dt><dd>{{ formatCount(stats?.reviewCount) }} recensioner</dd></div>
          <div><dt>{{ formatCount(stats?.favorites) }}</dt><dd>sparade favoriter</dd></div>
        </dl>
        <p v-if="statsError" class="home-stats-note">{{ statsError }}</p>
      </div>

      <RouterLink v-if="featuredRecipe" class="home-featured" :to="`/recept/${featuredRecipe._id}`">
        <span class="home-featured__label">Rekommenderad just nu</span>
        <div class="home-featured__image" :style="(featuredRecipe.images?.[0] || featuredRecipe.image) ? { backgroundImage: `url(${featuredRecipe.images?.[0] || featuredRecipe.image})` } : undefined"></div>
        <div class="home-featured__body">
          <strong>{{ featuredRecipe.title }}</strong>
          <p>{{ featuredRecipe.description }}</p>
          <small>{{ featuredRecipe.averageRating ? `${featuredRecipe.averageRating.toFixed(1)} ★` : 'Ny favorit' }} · {{ featuredRecipe.prepTime + featuredRecipe.cookTime }} min</small>
        </div>
      </RouterLink>
      <div v-else class="hero-stamp" aria-label="Laga nagot gott idag">
        <span>laga</span>
        <strong>nagot<br />gott</strong>
        <span>idag</span>
      </div>
    </section>

    <section class="home-band home-band--stats" data-scroll-reveal>
      <p class="eyebrow">Levande receptbank</p>
      <h2>Byggd pa vad anvandare faktiskt lagar, sparar och betygsatter.</h2>
      <p>Rekommendationerna vager in betyg, aktivitet, farskhet och hur latt receptet ar att komma igang med.</p>
    </section>

    <section class="home-section home-flow" aria-labelledby="flow-title">
      <div class="section-heading" data-scroll-reveal>
        <div><p class="eyebrow">Fran ide till middag</p><h2 id="flow-title">Tre steg som gor vardagen lugnare.</h2></div>
        <p class="section-copy">Sok brett, spara smart och lat rekommendationerna forma nasta maltid nar du inte orkar borja fran noll.</p>
      </div>
      <div class="flow-grid" data-stagger>
        <article class="flow-card"><span>01</span><strong>Hitta ratt snabbt</strong><p>Filtrera pa tid, niva och kategori nar middagen behover landa utan drama.</p></article>
        <article class="flow-card"><span>02</span><strong>Spara favoriter</strong><p>Bygg en egen liten kokshylla med recept du faktiskt vill komma tillbaka till.</p></article>
        <article class="flow-card"><span>03</span><strong>Fa battre forslag</strong><p>Rekommenderat-laget prioriterar recept med bra betyg, aktivitet och rimlig tillagningstid.</p></article>
      </div>
    </section>

    <section class="home-section home-categories" aria-labelledby="categories-title" data-scroll-reveal>
      <div class="section-heading">
        <div><p class="eyebrow">Borja har</p><h2 id="categories-title">Vad ar du sugen pa?</h2></div>
        <RouterLink class="subtle-link" to="/recept">Alla recept -></RouterLink>
      </div>
      <div class="category-grid" data-stagger>
        <RouterLink class="category-card category-card--quick" to="/recept?maxTime=30"><span>Under 30 min</span><strong>Snabbt &amp; enkelt</strong><i aria-hidden="true">-></i></RouterLink>
        <RouterLink class="category-card category-card--weekend" to="/recept?sort=recommended"><span>Nar det far ta tid</span><strong>Utvalt for dig</strong><i aria-hidden="true">-></i></RouterLink>
        <RouterLink class="category-card category-card--share" to="/recept?sort=popular"><span>For fler runt bordet</span><strong>Mest uppskattat</strong><i aria-hidden="true">-></i></RouterLink>
      </div>
    </section>

    <section class="home-section home-split" data-scroll-reveal>
      <div>
        <p class="eyebrow">Smartare rekommendationer</p>
        <h2>Mindre scrollande, mer matlagning.</h2>
      </div>
      <div class="insight-list" data-stagger>
        <p><strong>Betyg</strong><span>Lyfter recept som andra faktiskt uppskattar.</span></p>
        <p><strong>Aktivitet</strong><span>Tar med recensioner och visningar utan att gamla favoriter tar over helt.</span></p>
        <p><strong>Fraschhet</strong><span>Ger nya recept chans att synas nar de borjar fa fart.</span></p>
      </div>
    </section>

    <section class="home-section home-latest" aria-labelledby="latest-title" data-scroll-reveal>
      <div class="section-heading">
        <div><p class="eyebrow">Nytt i receptbanken</p><h2 id="latest-title">Rekommenderat att laga.</h2></div>
        <RouterLink class="subtle-link" to="/recept">Se hela katalogen -></RouterLink>
      </div>
      <p v-if="recipeStore.isLoading" class="state-message">Hamtar recept...</p>
      <p v-else-if="recipeStore.errorMessage" class="state-message state-message--error">Kunde inte hamta recepten just nu.</p>
      <div v-else-if="latestRecipes.length" class="recipe-grid" data-stagger><RecipeCard v-for="recipe in latestRecipes" :key="recipe._id" :recipe="recipe" /></div>
      <div v-else class="home-empty"><p>De forsta recepten ar pa vag in.</p><RouterLink class="button button--dark" to="/skapa-recept">Dela ett recept <span aria-hidden="true">-></span></RouterLink></div>
    </section>

    <section class="home-callout" data-scroll-reveal>
      <div><p class="eyebrow">Din egen samling</p><h2>Spara det som blir en favorit.</h2><p>Med ett konto kan du samla recept, skapa egna och alltid ha nasta middag nara till hands.</p></div>
      <RouterLink class="button button--light" to="/registrera">Kom igang gratis <span aria-hidden="true">-></span></RouterLink>
    </section>
  </main>
</template>
