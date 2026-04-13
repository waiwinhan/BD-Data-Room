export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === '/login') return

  // On server-side, session is read from cookie directly — always reliable.
  // On client-side, useUserSession() is hydrated from the server state.
  const { loggedIn } = useUserSession()
  if (!loggedIn.value) {
    return navigateTo('/login', { replace: true })
  }
})
