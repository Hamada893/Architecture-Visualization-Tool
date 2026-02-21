const PROJECT_PREFIX = 'architecture_visualizer_'

const jsonError = (status, message, extra = {}) =>
  new Response(JSON.stringify({ error: message, ...extra }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  })

const getUserId = async (userPuter) => {
  try {
    const user = await userPuter.auth.getUser()

    return user?.uuid || null
  } catch {
    return null
  }
}

router.post('api/projects/save', async ({request, user}) => {
  try {
    const userPuter = user.puter

    if (!userPuter) return jsonError(401, 'Authentication failed')

    const body = await request.json()
    const project = body?.project

    if (!project?.id) return jsonError(400, 'Missing or not found required project id')
    if (project?.sourceImage) return jsonError(400, 'sourceImage must not be included in project payload')

    const payload = {
      ...project,
      updatedAt: new Date().toISOString()
    }

    const userId = await getUserId(userPuter)
    if (!userId) return jsonError(401, 'Authentication failed')

    const key = `${PROJECT_PREFIX}${userId}_${project.id}`
    await userPuter.kv.set(key, payload)

    return {saved: true, id: project.id, project: payload}
  } catch (e) {
    return jsonError(500, 'Failed to save project', {message: e.message || 'Unknown error'})
  }
})

router.get('api/projects/list', async ({ user }) => {
  try {
    const userPuter = user.puter
    if (!userPuter) return jsonError(401, 'Authentication failed')

    const userId = await getUserId(userPuter)
    if (!userId) return jsonError(401, 'Authentication failed')

    const listPrefix = `${PROJECT_PREFIX}${userId}_`
    const listResult = await userPuter.kv.list(listPrefix, true)
    const items = Array.isArray(listResult) ? listResult : listResult?.keys ?? []
    const values = items.map((item) => (item && typeof item === 'object' && 'value' in item ? item.value : item))

    return { projects: values }
  } catch (e) {
    return jsonError(500, 'Failed to list projects', { message: e?.message || 'Unknown error' })
  }
})

router.get('api/projects/get', async ({ request, user }) => {
  try {
    const userPuter = user.puter
    if (!userPuter) return jsonError(401, 'Authentication failed')

    const userId = await getUserId(userPuter)
    if (!userId) return jsonError(401, 'Authentication failed')

    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    if (!id) return jsonError(400, 'Missing id parameter')

    const key = `${PROJECT_PREFIX}${userId}_${id}`
    const project = await userPuter.kv.get(key)
    if (project == null) return jsonError(404, 'Project not found')

    return { project }
  } catch (e) {
    return jsonError(500, 'Failed to get project', { message: e?.message || 'Unknown error' })
  }
})
