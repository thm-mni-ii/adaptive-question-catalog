import authService from '@/services/auth/auth.service'
import { isEmbedded, startFbsBridge, requestFbsToken, fbsTargetPath, fbsConnectionError } from '@/services/auth/fbsBridge'
import { isFeedbacksystemCallback, completeFeedbacksystemSignIn, renewFeedbacksystemToken } from '@/services/auth/fbsOidc'
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { useAuthStore } from '@/stores/authStore'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/login', component: () => import('../components/auth/FeedbacksystemLogin.vue') },
    { path: '/oauth2/callback', component: () => import('../components/auth/FeedbacksystemLogin.vue') },
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      // Globaler, kursunabhängiger Aufgabenpool: Kompetenzen und Aufgaben werden
      // hier angelegt und später einzelnen Kursen zugeordnet.
      path: '/pool',
      name: 'questionPool',
      component: () => import('../views/QuestionOverviewView.vue'),
      meta: { requiresAdmin: true }
    },
    {
      // Dozenten-Sandbox zum Simulieren von Algorithmus + Aufgabenpool, bevor
      // eine Konfiguration für Studenten live geschaltet wird.
      path: '/lab',
      name: 'AlgorithmLab',
      component: () => import('../views/AlgorithmLabView.vue'),
      meta: { requiresAdmin: true }
    },
    {
      // Kurs-Workspace: gemeinsamer Rahmen (Kopfzeile + kursbezogene
      // Unternavigation) für alle Ansichten, die zu genau einem Kurs gehören.
      path: '/courses/:courseId',
      component: () => import('../views/CourseWorkspaceView.vue'),
      children: [
        {
          path: '',
          name: 'studyCourse',
          component: () => import('../views/StudyCourseView.vue')
        },
        {
          path: 'competencies',
          name: 'courseCompetencies',
          component: () => import('../views/CompetencyGraphView.vue')
        },
        {
          path: 'questions',
          name: 'courseQuestions',
          component: () => import('../views/CourseQuestionsView.vue'),
          meta: { requiresAdmin: true }
        },
        {
          path: 'settings',
          name: 'courseSettings',
          component: () => import('../views/CourseSettingsView.vue'),
          meta: { requiresAdmin: true }
        },
        {
          path: 'session/:sessionId',
          name: 'studySession',
          component: () => import('../views/StudySessionView.vue')
        }
      ]
    }
    // {
    //   path: "/:pathMatch(.*)*",
    //   name: "not-found",
    //   component: () => import("../views/NotFoundView.vue"),
    // },
  ]
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (!isEmbedded && isFeedbacksystemCallback()) return await completeFeedbacksystemSignIn()
  if (to.path === '/login') return true
  let valid = false
  try {
    if (isEmbedded) {
      fbsTargetPath.value = to.fullPath
      if (!(await startFbsBridge())) return { path: '/login', query: { returnTo: to.fullPath } }
    }
    if (auth.token) {
      valid = (await authService.validateToken()).data === true
      if (!valid && (await (isEmbedded ? requestFbsToken() : renewFeedbacksystemToken()))) valid = (await authService.validateToken()).data === true
    }
  } catch { fbsConnectionError.value = 'Die Anmeldung konnte nicht geprüft werden. Bitte API-Verbindung und FBS-Konfiguration prüfen.' }
  if (!valid) {
    auth.clearToken()
    return { path: '/login', query: { returnTo: to.fullPath } }
  }
  if (to.meta.requiresAdmin && auth.decodedToken?.globalRole !== 'ADMIN') return { name: 'home', query: { forbidden: '1' } }
  return true
})
export default router
