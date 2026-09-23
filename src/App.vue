<template>
	<div class="site-shell">
		<ToastMessage />
		<header class="site-header">
			<RouterLink class="brand" to="/"><span class="brand-mark" aria-hidden="true">▤</span> Receptbanken</RouterLink>
			<nav aria-label="Huvudnavigation">
				<RouterLink to="/recept">Recept</RouterLink>
				<RouterLink to="/om-oss">Om oss</RouterLink>
				<RouterLink to="/kontakt">Kontakt</RouterLink>
			</nav>
			<div v-if="authStore.user" class="header-user-menu">
				<RouterLink class="header-profile" to="/profil"><span>{{ authStore.user.username }}</span><span class="profile-dot"><img v-if="authStore.user.profileImage" :src="authStore.user.profileImage" :alt="`Profilbild för ${authStore.user.username}`" /><span v-else>{{ authStore.user.username.charAt(0).toUpperCase() }}</span></span></RouterLink>
				<div class="profile-dropdown">
					<div class="profile-dropdown__greeting"><span class="profile-dot"><img v-if="authStore.user.profileImage" :src="authStore.user.profileImage" :alt="`Profilbild för ${authStore.user.username}`" /><span v-else>{{ authStore.user.username.charAt(0).toUpperCase() }}</span></span><strong>Hej, <span>{{ authStore.user.username }}</span></strong></div>
					<RouterLink exact-active-class="profile-dropdown__item--active" to="/dashboard">Dashboard</RouterLink>
					<RouterLink exact-active-class="profile-dropdown__item--active" to="/favoriter">Favoriter</RouterLink>
					<RouterLink v-if="['moderator', 'admin'].includes(authStore.user.role)" exact-active-class="profile-dropdown__item--active" to="/admin">Admin</RouterLink>
					<button class="profile-dropdown__logout" type="button" @click="signOut">Logga ut</button>
				</div>
			</div>
			<RouterLink v-if="!authStore.user" class="header-action" to="/logga-in">Logga in <span aria-hidden="true">↗</span></RouterLink>
			<button v-else type="button" class="header-action" @click="signOut">Logga ut <span aria-hidden="true">↗</span></button>
		</header>
		<RouterView />
		<footer class="site-footer">
			<div class="footer-brand">
				<RouterLink class="brand" to="/"><span class="brand-mark" aria-hidden="true">▤</span> Receptbanken</RouterLink>
				<p>Mat som känns hemma, sparad på ett ställe och lätt att hitta när vardagen behöver ett bättre svar.</p>
			</div>
			<nav class="footer-links" aria-label="Sidfot">
				<RouterLink to="/recept">Recept</RouterLink>
				<RouterLink to="/om-oss">Om oss</RouterLink>
				<RouterLink to="/kontakt">Kontakt</RouterLink>
				<RouterLink v-if="!authStore.user" to="/registrera">Skapa konto</RouterLink>
			</nav>
			<div class="footer-meta">
				<span>Receptbanken</span>
				<span>Mat som känns hemma.</span>
			</div>
		</footer>
	</div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

import { useAuthStore } from './stores/auth.store'
import ToastMessage from './components/ToastMessage.vue'

const router = useRouter()
const authStore = useAuthStore()

async function signOut() {
	await authStore.logout()
	await router.push('/')
}
</script>
