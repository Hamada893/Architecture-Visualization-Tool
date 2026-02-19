import puter from "@heyputer/puter.js"
import { getOrCreateHostingConfig, uploadImageToHosting } from "./puter.hosting"
import { isHostedUrl } from "./utils"

export const signIn = async () => await puter.auth.signIn()

export const signOut = () => puter.auth.signOut()

export const getCurrentUser = async () => {
  try {
    return await puter.auth.getUser()
  } catch {
    return null
  }
}

export const createProject = async ({ item }: CreateProjectParams): 
  Promise<DesignItem | null> => {
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
      }
     } catch (e) {
      console.error("Failed to persist project", {
        projectId,
        error: e,
      })
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
