import { removeMember } from './member'

export default async function globalTeardown() {
  await removeMember()
}
