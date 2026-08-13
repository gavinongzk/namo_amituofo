import { currentUser } from '@clerk/nextjs'

/**
 * Guest event/register routes skip Clerk middleware so Facebook in-app browsers
 * are not stuck on the 401 handshake. currentUser() throws on those routes.
 */
export async function getOptionalCurrentUser() {
  try {
    return await currentUser()
  } catch {
    return null
  }
}
