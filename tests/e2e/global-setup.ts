import type { FullConfig } from '@playwright/test'
import { createMember } from './member'

export default async function globalSetup(config: FullConfig) {
  await createMember(String(config.projects[0]!.use.baseURL))
}
