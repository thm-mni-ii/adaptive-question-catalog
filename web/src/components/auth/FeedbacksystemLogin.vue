<template>
  <v-container class="login">
    <v-card class="pa-6" max-width="640" width="100%">
      <v-card-title class="text-wrap">Adaptive Question Catalog – Anmeldung</v-card-title>
      <v-card-text>
        <p>Die Anmeldung erfolgt über das Feedbacksystem (FBS). Für den Fragenkatalog brauchst du kein eigenes Passwort.</p>
        <v-alert v-if="error" type="error" class="my-4">{{ error }}</v-alert>
        <p class="my-4">Im FBS: Melde dich dort an und öffne „Adaptive Question Catalog“ in der Navigation. Deine Sitzung wird automatisch übernommen.</p>
        <p class="my-4">Direkter Aufruf: Der Button führt dich zur FBS-Anmeldung. Nach erfolgreicher Anmeldung kehrst du hierher zurück.</p>
        <v-btn color="primary" :loading="busy" @click="connect">{{ isEmbedded ? 'Verbindung erneut herstellen' : 'Über das FBS anmelden' }}</v-btn>
        <p class="mt-4"><a v-if="fbsOrigin" :href="fbsOrigin" target="_blank" rel="noopener noreferrer">Feedbacksystem öffnen: {{ fbsOrigin }}</a></p>
        <v-expansion-panels class="mt-6">
          <v-expansion-panel :title="isDevelopment ? 'Lokale Entwicklung: FBS einrichten' : 'Einrichtung und Hilfe'">
            <v-expansion-panel-text>
              <p>Frontend, API v2, MongoDB und FBS müssen erreichbar sein. Bei Fehlern zuerst im FBS anmelden und die Anwendung erneut öffnen.</p>
              <template v-if="isDevelopment">
                <h3 class="mt-4">1. Feedbacksystem starten</h3>
                <p class="mt-3">Das separate FBS-Repository auf dem aktuellen dev-Branch verwenden. Für einen neuen Checkout die folgenden Befehle ausführen; bei vorhandenem Checkout direkt im FBS-Projektverzeichnis mit dem Compose-Befehl beginnen:</p>
                <pre class="setup-command mt-3"><code>git clone --branch dev https://github.com/thm-mni-ii/feedbacksystem.git
cd feedbacksystem
docker compose up -d --build web-shell
docker compose ps</code></pre>
                <p class="mt-3">Der Befehl baut Web Shell, Identity-Service, Core-API und Runner. Compose startet automatisch auch mysql1, mysql-checker, psql-checker, psql-sharing, mongodb, mongodb-playground und minio als Abhängigkeiten. Auf abgeschlossene Builds und erfolgreiche Healthchecks warten. Die Datei secrets/identity-signing-key.p12 muss im FBS-Checkout vorhanden sein.</p>
                <p class="mt-3">Läuft bereits das gesamte FBS, zuerst im FBS-Verzeichnis die Dienste mit Portkonflikten stoppen:</p>
                <pre class="setup-command mt-3"><code>docker compose stop qcm-frontend sql-playground-web</code></pre>
                <p class="mt-3">Damit sind die Ports 8086 und 3001 für diesen Fragenkatalog frei.</p>
                <p class="mt-3">Die FBS Web Shell unter <a href="http://localhost:8083" target="_blank" rel="noopener noreferrer">http://localhost:8083</a> öffnen. Lokaler Benutzer: <strong>admin</strong>, Passwort: <strong>admin123</strong>. Bei einer bestehenden FBS-Datenbank kann das Passwort bereits geändert worden sein.</p>
                <h3 class="mt-4">2. Fragenkatalog im FBS registrieren</h3>
                <p class="mt-3">Beim Fragenkatalog startet Docker nur API und MongoDB: im Projektverzeichnis <code>docker compose up -d --build --remove-orphans</code> ausführen. Das Frontend separat mit <code>cd web</code>, <code>npm ci</code> und <code>npm run dev</code> starten. Vite liest FBS-Adresse und Provider-ID aus <code>web/vite.config.ts</code>. Nach Änderungen Vite neu starten und <a href="http://localhost:8086/login">http://localhost:8086/login</a> öffnen. Der Web-Produktionsbuild gehört zu CI/CD; Produktion wird über <code>k3s-portainer.yaml</code> bereitgestellt.</p>
                <p class="mt-3">Als Admin die <a href="http://localhost:8083/admin/apps" target="_blank" rel="noopener noreferrer">Anwendungsverwaltung</a> öffnen und „Neue Anwendung registrieren“ wählen. Die folgenden Werte passen zur lokalen Konfiguration dieses Fragenkatalogs:</p>
              </template>
              <template v-else>
                <p class="mt-3">Für die Anmeldung dein Konto beim angebundenen FBS verwenden. Wenn die Anwendung dort fehlt oder der Login fehlschlägt, wende dich an die Administration.</p>
                <h3 class="mt-4">Einrichtung durch die Administration</h3>
                <p class="mt-3">Im produktiven FBS mit einem Administratorkonto die Anwendungsverwaltung öffnen und einen aktiven Provider mit den folgenden öffentlichen URLs registrieren. Die Anwendung muss über HTTPS erreichbar sein.</p>
                <p v-if="appManagementUrl" class="mt-3"><a :href="appManagementUrl" target="_blank" rel="noopener noreferrer">FBS-Anwendungsverwaltung öffnen</a></p>
              </template>
              <dl class="mt-3">
                <dt>Provider-/Client-ID</dt><dd><code>{{ fbsProviderId }}</code> (genau diesen Wert im FBS eintragen)</dd>
                <dt>Titel</dt><dd>Adaptive Question Catalog</dd>
                <dt>Icon</dt><dd>mdi-school</dd>
                <dt>Entry-URL</dt><dd>{{ entryUrl }}</dd>
                <dt>Einbettung</dt><dd>IFRAME oder EXTERNAL</dd>
                <dt>OIDC</dt><dd>{{ isDevelopment ? 'Aktiv; PUBLIC mit PKCE, kein Client-Secret.' : 'Aktiv; PUBLIC mit PKCE oder CONFIDENTIAL mit PKCE.' }}</dd>
                <dt>Redirect-URI</dt><dd>{{ fbsRedirectUri }}</dd>
                <dt>Scopes</dt><dd>openid, profile, email</dd>
                <dt>Aktiv / Navigation</dt><dd>Beides aktiviert</dd>
                <dt>Benötigte globale Rolle</dt><dd>{{ isDevelopment ? 'USER' : 'Nach gewünschter Sichtbarkeit, z. B. USER' }}</dd>
              </dl>
              <template v-if="isDevelopment">
                <h3 class="mt-4">3. Anmelden</h3>
                <p class="mt-3">Provider speichern und im FBS „Adaptive Question Catalog“ in der Navigation öffnen. Alternativ oben „Über das FBS anmelden“ wählen und beim FBS admin / admin123 eingeben. Der Fragenkatalog hat keinen eigenen Entwicklerlogin.</p>
              </template>
              <p v-else class="mt-3">Client-ID und Redirect-URI müssen exakt zu OIDC_CLIENT_ID und OIDC_REDIRECT_URIS der API passen. FBS_HOST_ORIGIN und JWT_ISSUER müssen dieselbe öffentliche FBS-Adresse verwenden; OIDC_TOKEN_URI und JWT_JWKS_URI müssen auf diese FBS-Instanz zeigen. Bei CONFIDENTIAL das Client-Secret ausschließlich im Portainer-Secret aqc-secrets unter OIDC_CLIENT_SECRET hinterlegen. Für PUBLIC bleibt es leer. Nach Konfigurationsänderungen die betroffenen Deployments neu ausrollen und beide Anmeldewege prüfen.</p>
              <p class="mt-3">Weitere Details stehen in der Repository-README. Kursdaten und fachliche Berechtigungen werden durch die Anmeldung allein nicht aus dem FBS synchronisiert.</p>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-card-text>
    </v-card>
  </v-container>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { isEmbedded, fbsConnectionError, fbsTargetPath } from '@/services/auth/fbsBridge'
import { signInWithFeedbacksystem, fbsRedirectUri, standaloneSignInError, standaloneSigningIn } from '@/services/auth/fbsOidc'
import { fbsOrigin, fbsProviderId } from '@/services/auth/config'
const route = useRoute()
const router = useRouter()
const retrying = ref(false)
const busy = computed(() => retrying.value || standaloneSigningIn.value)
const error = computed(() => isEmbedded ? fbsConnectionError.value : standaloneSignInError.value)
const entryUrl = new URL(import.meta.env.BASE_URL, window.location.origin).href
const isDevelopment = import.meta.env.DEV
const appManagementUrl = fbsOrigin ? new URL('/admin/apps', fbsOrigin).href : undefined
async function connect() {
  if (!isEmbedded) return signInWithFeedbacksystem(route.query.returnTo)
  retrying.value = true
  try { await router.replace(typeof route.query.returnTo === 'string' ? route.query.returnTo : fbsTargetPath.value) }
  finally { retrying.value = false }
}
</script>
<style scoped>
.login { min-height: 85vh; display: grid; place-items: center; }
dt { font-weight: 600; margin-top: 8px; }
dd, a { overflow-wrap: anywhere; }
.setup-command { padding: 12px; border-radius: 4px; background: rgba(var(--v-theme-on-surface), 0.06); white-space: pre-wrap; overflow-wrap: anywhere; }
</style>
