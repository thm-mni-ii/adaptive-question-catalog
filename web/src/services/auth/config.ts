declare global { interface Window { AQC_CONFIG?: { fbsOrigin?: string; providerId?: string } } }
export const fbsOrigin = window.AQC_CONFIG?.fbsOrigin || import.meta.env.VITE_FBS_HOST_ORIGIN
export const fbsProviderId = window.AQC_CONFIG?.providerId || import.meta.env.VITE_FBS_PROVIDER_ID
