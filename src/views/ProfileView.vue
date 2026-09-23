<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import QRCode from 'qrcode'

import { clearAccount, deleteAccount, disableTwoFactor, enableTwoFactor, fetchProfile, setupTwoFactor, updateAccount, updateProfile, uploadImages, type ProfileData } from '../services/api'
import { useAuthStore } from '../stores/auth.store'

const authStore = useAuthStore()
const profile = ref<ProfileData | null>(null)
const form = reactive({ username: '', email: '', bio: '', profileImage: '' })
const accountForm = reactive({ currentPassword: '', newPassword: '' })
const isLoading = ref(true)
const isSaving = ref(false)
const successMessage = ref('')
const twoFactorSetup = ref<{ secret: string; uri: string } | null>(null)
const twoFactorToken = ref('')
const twoFactorQr = ref('')
const twoFactorDisableToken = ref('')
const errorMessage = ref('')
const selectedProfileImage = ref<File | null>(null)

onMounted(async () => {
  try {
    profile.value = await fetchProfile()
    form.username = profile.value.username
    form.email = profile.value.email
    form.bio = profile.value.bio ?? ''
    form.profileImage = profile.value.profileImage ?? ''
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Kunde inte hämta profilen.'
  } finally {
    isLoading.value = false
  }
})

async function saveAccount() {
  try {
    const updated = await updateAccount({
      username: form.username,
      email: form.email,
      currentPassword: accountForm.currentPassword,
      newPassword: accountForm.newPassword || undefined
    });
    if (authStore.user) Object.assign(authStore.user, updated);
    successMessage.value = 'Kontot uppdaterades.';
    accountForm.currentPassword = '';
    accountForm.newPassword = '';
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Kunde inte uppdatera kontot.';
  }
}
async function clearUserAccount() {
  if (!window.confirm('Rensa alla recept, favoriter och recensioner?')) return;
  try {
    await clearAccount(accountForm.currentPassword);
    successMessage.value = 'Kontots innehåll har rensats.';
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Kunde inte rensa kontot.';
  }
}
async function removeUserAccount() {
  if (!window.confirm('Ta bort kontot permanent?')) return;
  try {
    await deleteAccount(accountForm.currentPassword);
      authStore.user = null
    window.location.href = '/';
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Kunde inte ta bort kontot.';
  }
}
async function saveProfile() {
  isSaving.value = true
  errorMessage.value = ''
  successMessage.value = ''
  try {
    const uploaded = selectedProfileImage.value ? await uploadImages([selectedProfileImage.value]) : []
    const updated = await updateProfile({ ...form, profileImage: uploaded[0] ?? form.profileImage })
    profile.value = updated
    if (authStore.user) Object.assign(authStore.user, { username: updated.username, profileImage: updated.profileImage })
    successMessage.value = 'Profilen sparades.'
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Kunde inte spara profilen.'
  } finally {
    isSaving.value = false
  }
}

function selectProfileImage(event: Event) { const input = event.target as HTMLInputElement; selectedProfileImage.value = input.files?.[0] ?? null }

async function beginTwoFactor() { try { twoFactorSetup.value = await setupTwoFactor(); twoFactorQr.value = await QRCode.toDataURL(twoFactorSetup.value.uri, { width: 220, margin: 1 }) } catch (error) { errorMessage.value = error instanceof Error ? error.message : 'Kunde inte starta 2FA.' } }
async function confirmTwoFactor() { try { await enableTwoFactor(twoFactorToken.value); successMessage.value = '2FA är aktiverat.'; twoFactorSetup.value = null } catch (error) { errorMessage.value = error instanceof Error ? error.message : 'Ogiltig 2FA-kod.' } }
async function rotateTwoFactor() { twoFactorSetup.value = null; await beginTwoFactor() }
async function turnOffTwoFactor() { try { await disableTwoFactor(twoFactorDisableToken.value); if (profile.value) profile.value.twoFactorEnabled = false; twoFactorDisableToken.value = ''; successMessage.value = '2FA är avstängt.' } catch (error) { errorMessage.value = error instanceof Error ? error.message : 'Ogiltig 2FA-kod.' } }
</script>

<template>
  <main class="profile-page">
    <p v-if="isLoading" class="state-message">Hämtar profil...</p>
    <p v-else-if="errorMessage && !profile" class="state-message state-message--error">{{ errorMessage }}</p>
    <template v-else-if="profile">
      <header class="page-heading"><div><p class="eyebrow">Din profil</p><h1>Hej, {{ profile.username }}.</h1></div><p>Berätta lite om personen bakom recepten.</p></header>
      <form class="profile-form" @submit.prevent="saveProfile">
        <div class="profile-avatar"> <img v-if="form.profileImage" :src="form.profileImage" :alt="`Profilbild för ${form.username}`" /><span v-else>{{ form.username.charAt(0).toUpperCase() }}</span></div>
        <label>Profilbildens URL<input v-model="form.profileImage" type="url" placeholder="https://..." /></label>
          <label>E-post<input v-model="form.email" type="email" required /></label>
        <label>Ladda upp profilbild <small>JPG, PNG eller WebP, max 5 MB</small><input type="file" accept="image/jpeg,image/png,image/webp" @change="selectProfileImage" /></label>
        <label>Biografi<textarea v-model="form.bio" rows="5" maxlength="500" placeholder="Vad tycker du om att laga?"></textarea></label>
        <p v-if="errorMessage" class="form-error" role="alert">{{ errorMessage }}</p>
        <p v-if="successMessage" class="form-success" role="status">{{ successMessage }}</p>
        <button class="button button--dark" type="submit" :disabled="isSaving">{{ isSaving ? 'Sparar...' : 'Spara ändringar' }} <span aria-hidden="true">→</span></button>
      </form>
          <section class="profile-form mt-4">
            <p class="eyebrow">Kontoinställningar</p>
            <h2 class="font-serif text-3xl">Lösenord och konto</h2>
            <label>Nuvarande lösenord<input v-model="accountForm.currentPassword" type="password" required /></label>
            <label>Nytt lösenord<input v-model="accountForm.newPassword" type="password" minlength="12" placeholder="Lämna tomt för att behålla nuvarande" /></label>
            <div class="flex flex-wrap gap-3">
              <button class="button button--dark" type="button" @click="saveAccount">Spara kontoändringar</button>
              <button class="danger-button" type="button" @click="clearUserAccount">Rensa innehåll</button>
              <button class="danger-button" type="button" @click="removeUserAccount">Ta bort konto</button>
            </div>
          </section>
      <section class="profile-security"><p class="eyebrow">Säkerhet</p><h2>Tvåfaktorsinloggning</h2><p>Använd en Authenticator-app för ett extra skydd vid inloggning.</p><div v-if="profile.twoFactorEnabled && !twoFactorSetup" class="security-active"><strong>2FA är aktivt</strong><button class="security-button" type="button" @click="rotateTwoFactor">Flytta till ny telefon</button><label>Stäng av med kod<input v-model="twoFactorDisableToken" inputmode="numeric" maxlength="6" /></label><button class="danger-button" type="button" @click="turnOffTwoFactor">Stäng av 2FA</button></div><button v-else-if="!twoFactorSetup" class="subtle-link security-button" type="button" @click="beginTwoFactor">Konfigurera 2FA</button><div v-else><img class="two-factor-qr" :src="twoFactorQr" alt="QR-kod för Authenticator" /><p class="security-secret">Eller lägg till denna kod: <strong>{{ twoFactorSetup.secret }}</strong></p><label>Verifieringskod<input v-model="twoFactorToken" inputmode="numeric" maxlength="6" /></label><button class="button button--dark" type="button" @click="confirmTwoFactor">Aktivera 2FA</button></div></section>
    </template>
  </main>
</template>
