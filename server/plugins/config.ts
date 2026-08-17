import { parseConfig } from '../utils/config'

// Validate configuration at boot and fail fast with a readable message.
export default defineNitroPlugin(() => {
  parseConfig()
})
