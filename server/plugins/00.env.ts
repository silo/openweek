import { getEnv } from '../utils/runtime-config'

// Validate the environment once, at server startup — fail fast with a clear
// message rather than crashing on the first request.
export default defineNitroPlugin(() => {
  getEnv()
})
