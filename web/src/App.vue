<template>
  <v-app>
    <v-app-bar app color="black">
      <v-tabs class="d-flex justify-between">
        <v-tab :to="{ name: 'home' }">Startseite</v-tab>
        <!--
          Aufgabenpool und Algorithm Lab sind Dozenten-Werkzeuge und daher nur
          für ADMIN sichtbar. Kompetenzen/Aufgaben/Einstellungen eines
          konkreten Kurses sind bewusst kein globaler Menüpunkt mehr, sondern
          Teil der Unternavigation im jeweiligen Kurs-Workspace.
        -->
        <v-tab v-if="isAdmin" :to="{ name: 'questionPool' }">Aufgabenpool</v-tab>
        <v-tab v-if="isAdmin" :to="{ name: 'AlgorithmLab' }">Algorithm Lab</v-tab>
      </v-tabs>
      <v-btn v-if="authStore.token && !isEmbedded" @click="signOut">Abmelden</v-btn>
    </v-app-bar>
    <v-main>
      <RouterView />
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

import { isEmbedded } from '@/services/auth/fbsBridge'
import { forgetFeedbacksystemSession } from '@/services/auth/fbsOidc'
const authStore = useAuthStore()
function signOut() {
  forgetFeedbacksystemSession()
  authStore.clearToken()
  window.location.assign('/login')
}
const isAdmin = computed(() => authStore.decodedToken?.globalRole === 'ADMIN')
</script>

<style scoped lang="scss"></style>
