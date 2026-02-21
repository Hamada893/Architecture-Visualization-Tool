const PROJECT_PREFIX = 'architecture_visualizer_'

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
}

const jsonError = (status, message, extra = {}) =>
  new Response(JSON.stringify({ error: message, ...extra }), {
    status,
    headers: corsHeaders
  })

const successResponse = (data) =>
  new Response(JSON.stringify(data), {
    status: 200,
    headers: corsHeaders
  })

router.options('api/projects/*', () => new Response(null, { status: 204, headers: corsHeaders }))

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

      let body
      try {
        body = await request.json()
      } catch {
        return jsonError(400, 'Invalid JSON payload')
      }

  const project = body?.project
  const rawId = typeof project?.id === 'string' ? project.id : ''
  const id = rawId.trim()

    if (!id) {
        return jsonError(400, 'Missing or invalid project id')
      }
      if (id.length > 128) {
        return jsonError(400, 'Project id is too long')
      }
    if (project?.sourceImage) return jsonError(400, 'sourceImage must not be included in project payload')

    const payload = {
      ...project,
      id,
      updatedAt: new Date().toISOString()
    }

    const userId = await getUserId(userPuter)
    if (!userId) return jsonError(401, 'Authentication failed')

    const key = `${PROJECT_PREFIX}${userId}_${id}`
    await userPuter.kv.set(key, payload)

    return successResponse({ saved: true, id, project: payload })
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

    return successResponse({ projects: values })
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

    return successResponse({ project })
  } catch (e) {
    return jsonError(500, 'Failed to get project', { message: e?.message || 'Unknown error' })
  }
})
