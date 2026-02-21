import puter from "@heyputer/puter.js"
import { getOrCreateHostingConfig, uploadImageToHosting } from "./puter.hosting"
import { isHostedUrl } from "./utils"
import { PUTER_WORKER_URL } from "./constants"

export const signIn = async () => await puter.auth.signIn()

export const signOut = () => puter.auth.signOut()

export const getCurrentUser = async () => {
  try {
    return await puter.auth.getUser()
  } catch {
    return null
  }
}

export const createProject = async ({ item, visibility = "private" }: CreateProjectParams): 
  Promise<DesignItem | null> => {
    if (!PUTER_WORKER_URL) {
      console.warn(`Missing VITE_PUTER_WORKER_URL; skip history`)
      return null
    }

    const projectId = item.id

    let hosting: HostingConfig | null = null
    try {
      hosting = await getOrCreateHostingConfig()
    } catch (e) {
      console.error("getOrCreateHostingConfig() threw while creating project", {
        projectId,
        error: e,
      })
      return null
    }

    if (!hosting) {
      console.error("getOrCreateHostingConfig() returned null, cannot host project images", {
        projectId,
        sourceImagePreview: item.sourceImage?.slice?.(0, 64),
      })
      return null
    }

    const hostedSource = projectId
      ? await uploadImageToHosting({
          hosting,
          url: item.sourceImage,
          projectId,
          label: "source",
        })
      : null

    const hostedRender =
      projectId && item.renderedImage
        ? await uploadImageToHosting({
            hosting,
            url: item.renderedImage,
            projectId,
            label: "rendered",
          })
        : null

    const resolvedSource = hostedSource?.url
      ? hostedSource.url
      : isHostedUrl(item.sourceImage)
        ? item.sourceImage
        : ""

    if(!resolvedSource) {
      console.warn("Failed to resolve source image for project, skipping save", {
        projectId,
        hosting,
        hostedSource,
        originalSourceSample: item.sourceImage?.slice?.(0, 64),
      })
      return null
    }

    const resolvedRender = hostedRender?.url
    ? hostedRender.url
    : item.renderedImage && isHostedUrl(item.renderedImage)
      ? item.renderedImage
      : undefined

    const { 
      sourcePath: _sourcePath,
      renderedPath: _renderedPath,
      publicPath: _publicPath,
      ...rest
     } = item

     const payload: DesignItem = {
      ...rest, 
      sourceImage: resolvedSource,
      renderedImage: resolvedRender ?? null
     }

     try {
      if (projectId) {
        await puter.kv.set(`project:${projectId}`, payload)
        const response = await puter.workers.exec(`${PUTER_WORKER_URL}/api/projects/save`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ project: payload, visibility }),
        })
        if (!response.ok) {
          console.warn('Worker save failed (project saved locally):', await response.text())
          return payload
        }

        const data = (await response.json()) as { project?: DesignItem | null}
        return data?.project ?? payload
      }
     } catch (e) {
      console.warn("Worker unreachable (project saved locally):", e instanceof Error ? e.message : e)
     }

     return payload
  }

export const getProject = async (id: string): Promise<DesignItem | null> => {
  if (!id) return null

  try {
    const stored = (await puter.kv.get(`project:${id}`)) as DesignItem | null
    return stored ?? null
  } catch (e) {
    console.error("Failed to load project", {
      projectId: id,
      error: e,
    })
    return null
  }
}

export const getProjects = async () => {
  if (!PUTER_WORKER_URL) {
    console.warn(`Missing VITE_PUTER_WORKER_URL; skip history`)
    return []
  }

  try {
    const response = await puter.workers.exec(`${PUTER_WORKER_URL}/api/projects/list`, {method: 'GET'})

    if (!response.ok) {
      console.error('Failed to fetch history', await response.text())
      return []
    }

    const data = (await response.json()) as { projects ?:  DesignItem[] | null}
    return Array.isArray(data?.projects) ? data?.projects : []
  } catch (e) {
    console.error(`Failed to get projects: `, e)
    return []
  }
}

export const getProjectById = async ({ id }: { id: string }) => {
  if (!id) return null;

  if (PUTER_WORKER_URL) {
    try {
      const response = await puter.workers.exec(
        `${PUTER_WORKER_URL}/api/projects/get?id=${encodeURIComponent(id)}`,
        { method: "GET" },
      );
      if (response.ok) {
        const data = (await response.json()) as { project?: DesignItem | null };
        if (data?.project != null) return data.project;
      }
    } catch {
      // Worker unreachable (CORS, 404, network); fall back to local KV
    }
  }

  return getProject(id);
};
