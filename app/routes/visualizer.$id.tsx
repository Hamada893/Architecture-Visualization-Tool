import { useEffect, useState, useRef } from "react"
import { useNavigate, useOutletContext, useParams } from "react-router"
import { createProject, getProjectById } from "lib/puter.action"
import { generate3DView } from "lib/ai.action"
import { Box, Download, RefreshCcw, Share2, X } from 'lucide-react'
import { Button } from "components/ui/Button"
import { Bouncy } from 'ldrs/react'
import 'ldrs/react/Bouncy.css'
import { ReactCompareSlider, ReactCompareSliderImage } from "react-compare-slider"

const VisualizerId = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [currentImage, setCurrentImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const hasInitialGenerated = useRef(false)
  const {userId} = useOutletContext<AuthContext>()
  const [project, setProject] = useState<DesignItem | null>(null)
  const [isProjectLoading, setIsProjectLoading] = useState(true)
  const [isCopied, setIsCopied] = useState(false)
  const handleBack = () => navigate('/')

  const handleExport = async () => {
    if (!currentImage) return
    const filename = `rendered-${project?.name ?? id ?? 'image'}.png`.replace(/\s+/g, '-')
    if (currentImage.startsWith('data:')) {
      const a = document.createElement('a')
      a.href = currentImage
      a.download = filename
      a.click()
      return
    }
    const res = await fetch(currentImage)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleShare = async () => {
    if (!currentImage) return
    const url = window.location.href
    await navigator.clipboard.writeText(url)
    setIsCopied(true)
    setTimeout(() => {
      setIsCopied(false)
    }, 2000)
  }

  const runGeneration = async (item: DesignItem) => {
    if (!id || !item.sourceImage) return

    try {
      setErrorMessage(null)
      setIsProcessing(true)
      const result = await generate3DView({ sourceImage: item.sourceImage })

      if(result.renderedImage) {
        setCurrentImage(result.renderedImage)

        const updatedItem = {
          ...item,
          renderedImage: result.renderedImage,
          renderedPath: result.renderedPath,
          timestamp: Date.now(),
          ownerId: item.ownerId ?? userId ?? null,
          isPublic: item.isPublic ?? false
        }

        const saved = await createProject({
          item: updatedItem,
          visibility: 'private'
        })

        if (saved) {
          setProject(saved)
          setCurrentImage(saved.renderedImage || result.renderedImage)
        }
      }
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'Unknown error occurred'
      console.error(`Generation failed: ${e}`)
      setErrorMessage(`Failed to generate visualization. ${errorMsg}`)
    } finally {
      setIsProcessing(false)
    }
  }

  useEffect(() => {
    let isMounted = true;

    const loadProject = async () => {
      if (!id) {
        setIsProjectLoading(false);
        return;
      }

      setIsProjectLoading(true);

      const fetchedProject = await getProjectById({ id });

      if (!isMounted) return;

      setProject(fetchedProject);
      setCurrentImage(fetchedProject?.renderedImage || null);
      setIsProjectLoading(false);
      hasInitialGenerated.current = false;
    };

    loadProject();

    return () => {
      isMounted = false;
    };
  }, [id])

  useEffect(() => {
    if (
      isProjectLoading ||
      hasInitialGenerated.current ||
      !project?.sourceImage
    )
      return;

    if (project.renderedImage) {
      setCurrentImage(project.renderedImage);
      hasInitialGenerated.current = true;
      return;
    }

    hasInitialGenerated.current = true;
    void runGeneration(project);
  }, [project, isProjectLoading])


  return (
    <div className="visualizer">
      <nav className="topbar" onClick={handleBack}>
        <div className="brand">
          <Box className='logo'/>
          <span className='name'>Architecture Visualizer</span>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleBack}
          className="exit"
          style={{ cursor: 'pointer' }}
        >
          <X className="icon"  /> Exit Editor
        </Button>
      </nav>
      <section className="content">
        <div className="panel">

        
          <div className="panel-header">
            <div className="panel-meta">
              <p>Project</p>
              <h2>{project?.name || `Residence ${id}`}</h2>
              <p className="note">Created by You</p>
            </div>
            
            <div className="panel-actions">
              <Button 
                size="sm" 
                onClick={handleExport}
                className="export"
                disabled={!currentImage}
                style={{ cursor: 'pointer' }}
              >
                <Download className="w-4 h-4 mr-2"/> Export
              </Button>
              <Button
                size="sm"
                onClick={handleShare} 
                className="share"
                style={{ cursor: 'pointer' }}
                disabled={!currentImage}
              >
                <Share2 className="w-4 h-4 mr-2"/> {isCopied ? 'Copied!' : 'Share'}  
              </Button>
            </div>
          </div>

          {errorMessage && (
            <div className="error-banner" style={{ 
              padding: '12px 16px', 
              backgroundColor: '#fee2e2', 
              color: '#991b1b', 
              borderRadius: '6px', 
              margin: '16px 0',
              border: '1px solid #fecaca'
            }}>
              <p style={{ margin: 0 }}>{errorMessage}</p>
            </div>
          )}

          <div className={`render-area ${isProcessing ? 'is-processing' : ''}`}>
            {currentImage ? (
              <img 
                src={currentImage}
                alt="AI Rendered Image"
                className="render-img"
              />
            ) : (
            <div className="render-placeholder">
                {project?.sourceImage && (
                <img 
                  src={project?.sourceImage}
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
                  <span className="title">Rendering <Bouncy speed='1.3' size='15'/></span>
                  <span className="subtitle">Generating your 3D visualization <Bouncy speed='1.3' size='10' color='gray'/> </span>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="panel compare">
          <div className="panel-header">
            <div className="panel-meta">
              <p>Comparison</p>
              <h3>Before and After</h3>
            </div>
            <div className="hint">Drag to compare</div>
          </div>

          <div className="compare-stage">
            {project?.sourceImage && currentImage ? (
              <ReactCompareSlider
                defaultValue={50}
                style={{ width: '100%', height: 'auto' }}
                itemOne={
                  <ReactCompareSliderImage 
                    src={project?.sourceImage} 
                    alt="Original Image" 
                    className="compare-img"
                  />
                }
                itemTwo={
                  <ReactCompareSliderImage 
                    src={(currentImage || project?.renderedImage) ?? undefined} 
                    alt="Generated Image" 
                    className="compare-img"
                  />
                }
              />
            ) : (
              <div className="compare-fallback">
                <img src={project?.sourceImage} alt="Original Image" className="compare-fallback-img" />
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

export default VisualizerId
