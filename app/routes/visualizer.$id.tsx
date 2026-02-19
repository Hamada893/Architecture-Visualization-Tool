import { useEffect, useState } from "react"
import { useLocation, useParams } from "react-router"
import { getProject } from "lib/puter.action"

const VisualizerId = () => {
  const location = useLocation()
  const { id } = useParams<{ id: string }>()
  const locationState = (location.state || null) as VisualizerLocationState | null

  const [initialImage, setInitialImage] = useState<string | null>(locationState?.initialImage ?? null)
  const [name, setName] = useState<string | null>(locationState?.name ?? null)

  useEffect(() => {
    if (locationState || !id) return

    let cancelled = false

    const load = async () => {
      const project = await getProject(id)
      if (!project || cancelled) return

      setInitialImage(project.sourceImage ?? null)
      setName(project.name ?? null)
    }

    load()

    return () => {
      cancelled = true
    }
  }, [id, locationState])

  return (
    <section>
      <h1>{name || 'Untitled Project'}</h1>
      <div className="visualizer">
        {initialImage && (
          <div className="image-container">
            <h2>Source Image</h2>
            <img src={initialImage} alt={`Source image for ${name || 'project'}`}/>
          </div>
        )}
      </div>
    </section>
  )
}

export default VisualizerId
