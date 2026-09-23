<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { fetchAdminDashboard, fetchAdminReports, type AdminDashboardData, type AdminReport } from '../services/api'
import ActivityLogPanel from '../components/ActivityLogPanel.vue'

const data = ref<AdminDashboardData | null>(null)
const isLoading = ref(true)
const errorMessage = ref('')
const reports = ref<AdminReport[]>([])

onMounted(async () => {
  try { [data.value, reports.value] = await Promise.all([fetchAdminDashboard(), fetchAdminReports()]) } catch (error) { errorMessage.value = error instanceof Error ? error.message : 'Kunde inte hämta adminpanelen.' } finally { isLoading.value = false }
})
</script>

<template>
  <main class="admin-page">
    <p v-if="isLoading" class="state-message">Hämtar adminpanel...</p>
    <p v-else-if="errorMessage" class="state-message state-message--error">{{ errorMessage }}</p>
    <template v-else-if="data">
      <header class="page-heading"><div><p class="eyebrow">Administration</p><h1>Översikt</h1></div><p>Håll koll på Receptbanken och dess innehåll.</p></header>
      <section class="stat-grid admin-stats"><div class="stat-card"><span>Användare</span><strong>{{ data.stats.users }}</strong><small>registrerade konton</small></div><div class="stat-card stat-card--sage"><span>Moderatorer</span><strong>{{ data.stats.moderators }}</strong><small>konton med moderator-roll</small></div><div class="stat-card stat-card--clay"><span>Admin</span><strong>{{ data.stats.admins }}</strong><small>konton med full behorighet</small></div><div class="stat-card"><span>Recept</span><strong>{{ data.stats.recipes }}</strong><small>publicerade recept</small></div><div class="stat-card stat-card--sage"><span>Kategorier</span><strong>{{ data.stats.categories }}</strong><small>aktiva kategorier</small></div><div class="stat-card stat-card--clay"><span>Visningar</span><strong>{{ data.stats.totalViews }}</strong><small>totala receptvisningar</small></div></section>
      <section class="grid gap-4 md:grid-cols-3" aria-label="Administrationssektioner"><RouterLink class="group border border-[#26352f]/15 bg-[#fffdf8] p-6 transition hover:-translate-y-1 hover:border-[#c16e4b]" to="/admin/hantera?sektion=users"><span class="text-xs font-bold uppercase tracking-[.16em] text-[#6f8067]">Sektion 01</span><h2 class="mt-5 font-serif text-3xl text-[#26352f]">Användare</h2><p class="mt-2 text-sm leading-6 text-[#718078]">Granska konton, roller och ta bort användare.</p><span class="mt-6 block font-bold text-[#c16e4b]">Hantera användare →</span></RouterLink><RouterLink class="group border border-[#26352f]/15 bg-[#fffdf8] p-6 transition hover:-translate-y-1 hover:border-[#c16e4b]" to="/admin/hantera?sektion=recipes"><span class="text-xs font-bold uppercase tracking-[.16em] text-[#6f8067]">Sektion 02</span><h2 class="mt-5 font-serif text-3xl text-[#26352f]">Recept</h2><p class="mt-2 text-sm leading-6 text-[#718078]">Moderera, granska och ta bort publicerat innehåll.</p><span class="mt-6 block font-bold text-[#c16e4b]">Hantera recept →</span></RouterLink><RouterLink class="group border border-[#26352f]/15 bg-[#fffdf8] p-6 transition hover:-translate-y-1 hover:border-[#c16e4b]" to="/admin/hantera?sektion=categories"><span class="text-xs font-bold uppercase tracking-[.16em] text-[#6f8067]">Sektion 03</span><h2 class="mt-5 font-serif text-3xl text-[#26352f]">Kategorier</h2><p class="mt-2 text-sm leading-6 text-[#718078]">Skapa, redigera och strukturera kategorier.</p><span class="mt-6 block font-bold text-[#c16e4b]">Hantera kategorier →</span></RouterLink></section>
      <section class="mt-10 border border-[#26352f]/15 bg-[#fffdf8] p-6 md:p-8"><div class="mb-8 flex items-end justify-between"><div><p class="text-xs font-bold uppercase tracking-[.16em] text-[#6f8067]">Analys</p><h2 class="mt-2 font-serif text-4xl text-[#26352f]">Mest visade recept</h2></div><span class="text-sm text-[#718078]">Läsningar per recept</span></div><div class="grid gap-5"> <div v-for="(recipe, index) in data.mostViewedRecipes" :key="recipe._id" class="grid grid-cols-[1.5rem_1fr_auto] items-center gap-3"><span class="font-serif text-xl text-[#c16e4b]">{{ index + 1 }}</span><div><div class="mb-2 flex justify-between gap-4 text-sm"><strong>{{ recipe.title }}</strong><span class="text-[#718078]">{{ recipe.views }}</span></div><div class="h-2 overflow-hidden bg-[#d9e5d5]"><div class="h-full bg-[#c16e4b]" :style="{ width: `${Math.max(8, (recipe.views / Math.max(data.mostViewedRecipes[0]?.views ?? 1, 1)) * 100)}%` }"></div></div></div></div></div></section>
      <ActivityLogPanel />
      <section class="mt-10 border border-[#26352f]/15 bg-[#fffdf8] p-6 md:p-8"><div class="mb-6 flex items-end justify-between"><div><p class="text-xs font-bold uppercase tracking-[.16em] text-[#6f8067]">Moderering</p><h2 class="mt-2 font-serif text-4xl text-[#26352f]">Rapporter</h2></div><span class="text-sm text-[#718078]">{{ reports.length }} öppna</span></div><div class="grid divide-y divide-[#26352f]/10"><div v-for="report in reports" :key="report._id" class="grid gap-2 py-4 md:grid-cols-[1fr_1fr_auto]"><strong>{{ report.recipeId?.title || 'Borttaget recept' }}</strong><span class="text-sm text-[#718078]">{{ report.reason }}</span><small class="text-[#718078]">{{ report.userId?.username || 'Okänd användare' }}</small></div><p v-if="!reports.length" class="text-sm text-[#718078]">Inga öppna rapporter.</p></div></section>
    </template>
  </main>
</template>
