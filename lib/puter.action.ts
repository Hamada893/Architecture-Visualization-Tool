import puter from "@heyputer/puter.js"

export const signIn = async () => await puter.auth.signIn()

export const signOut = () => puter.auth.signOut()

export const getCurrentUser = async () => {
  try {
    return await puter.auth.getUser()
  } catch {
    return null
  }
}

export type ProjectData = {
  sourceImage?: string | null
  name?: string | null
}

export const getProject = async (id: string): Promise<ProjectData | null> => {
  try {
    const kv = puter.kv
    if (!kv) return null
    const raw = await kv.get(`project:${id}`)
    if (raw == null || typeof raw !== 'object') return null
    const o = raw as Record<string, unknown>
    return {
      sourceImage: typeof o.sourceImage === 'string' ? o.sourceImage : null,
      name: typeof o.name === 'string' ? o.name : null,
    }
  } catch {
    return null
  }
}
