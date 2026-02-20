import { useEffect, useState, useRef } from "react"
import { useLocation, useNavigate, useParams } from "react-router"
import { getProject } from "lib/puter.action"
import { generate3DView } from "lib/ai.action"
import { Box, Download, RefreshCcw, Share2, X } from 'lucide-react'
import { Button } from "components/ui/Button"

const VisualizerId = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams<{ id: string }>()
  const locationState = (location.state || null) as VisualizerLocationState | null

  const [initialImage, setInitialImage] = useState<string | null>(locationState?.initialImage ?? null)
  const {initialRender} = location.state || {}
  const [currentImage, setCurrentImage] = useState(initialRender)
  const [name, setName] = useState<string | null>(locationState?.name ?? null)
  const [isProcessing, setIsProcessing] = useState(false)
  const hasInitialGenerated = useRef(false)

  const handleBack = () => navigate('/')

  const runGeneration = async () => {
    if (!initialImage) return

    try {
      setIsProcessing(true)
      const result = await generate3DView({ sourceImage: initialImage })

      if(result.renderedImage) {
        setCurrentImage(result.renderedImage)


      }
    } catch (e) {
      console.error(`Generation failed: ${e}`)
    } finally {
      setIsProcessing(false)
    }
  }

  useEffect(() => {
    if (!initialImage || !hasInitialGenerated) return 

    if (initialRender) {
      setCurrentImage(initialRender)
      hasInitialGenerated.current = true 
      return 
    }

    hasInitialGenerated.current = true
    runGeneration()
    
  }, [initialImage, initialRender])

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
    <div className="visualizer">
      <nav className="topbar">
        <div className="brand">
          <Box className='logo'/>
          <span className='name'>Architecture Visualizer</span>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleBack}
          className="exit"
        >
          <X className="icon" /> Exit Editor
        </Button>
      </nav>
      <section className="content">
        <div className="panel">
          <div className="panel-header">
            <div className="panel-meta">
              <p>Project</p>
              <h2>{'Untitled Project'}</h2>
              <p className="note">Created by You</p>
            </div>
            
            <div className="panel-actions">
              <Button 
                size="sm" 
                onClick={() => {}}
                className="export"
                disabled={!currentImage}
              >
                <Download className="w-4 h-4 mr-2"/> Export
              </Button>
              <Button
                size="sm"
                onClick={() => {}}
                className="share"
              >
                <Share2 className="w-4 h-4 mr-2"/> Share
              </Button>
            </div>
          </div>


          <div className={`render-area ${isProcessing ? 'is-processing' : ''}`}>
            {currentImage ? (
              <img 
                src={currentImage}
                alt="AI Rendered Image"
                className="render-img"
              />
            ) : (
            <div className="render-placeholder">
                {initialImage && (
                <img 
                  src={initialImage}
                  alt="Original Image"
                  className="render-fallback"
                />
                )}
            </div>
            )}

            {isProcessing && (
              <div className="render-overlay">
                <div className="rendering-card">
                  <RefreshCcw className="spinner"/>
                  <span className="title">Rendering...</span>
                  <span className="subtitle">Generating your 3D visualization... </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

export default VisualizerId
