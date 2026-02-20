import { CheckCircle2, ImageIcon, UploadIcon } from 'lucide-react'
import React from 'react'
import { useState } from 'react'
import { useOutletContext } from 'react-router'
import {
  PROGRESS_INTERVAL_MS,
  PROGRESS_STEP,
  REDIRECT_DELAY_MS,
} from '../lib/constants'

type UploadProps = {
  onComplete?: (data: string) => void
}

const Upload = ({ onComplete }: UploadProps) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg']

  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [progress, setProgress] = useState(0)

  const { isSignedIn } = useOutletContext<AuthContext>()

  const processFile = (selectedFile: File) => {
    if (!isSignedIn) return

    const reader = new FileReader()
    reader.onerror = () => {
      setFile(null)
      setProgress(0)
    }
    reader.onload = () => {
      const result = reader.result as string
      const dataUrl = result

      let currentProgress = 0
      setProgress(0)

      const intervalId = window.setInterval(() => {
        currentProgress = Math.min(100, currentProgress + PROGRESS_STEP)
        setProgress(currentProgress)

        if (currentProgress >= 100) {
          window.clearInterval(intervalId)

          window.setTimeout(() => {
            if (isSignedIn) {
              onComplete?.(dataUrl)
            }
          }, REDIRECT_DELAY_MS)
        }
      }, PROGRESS_INTERVAL_MS)
    }


    reader.readAsDataURL(selectedFile)
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!isSignedIn) return

    const selectedFile = event.target.files?.[0]
    if (!selectedFile || !allowedTypes.includes(selectedFile.type)) return

    setFile(selectedFile)
    processFile(selectedFile)
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    if (!isSignedIn) return
    setIsDragging(true)
  }

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    if (!isSignedIn) return
    setIsDragging(true)
  }

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    if (!isSignedIn) return
    setIsDragging(false)
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    if (!isSignedIn) return

    setIsDragging(false)

    const droppedFile = event.dataTransfer.files?.[0]
    if (!droppedFile || !allowedTypes.includes(droppedFile.type)) return

    setFile(droppedFile)
    processFile(droppedFile)
  }

  return (
    <div className='upload'>
      { !file ? (
        <div
          className={`dropzone ${isDragging ? 'dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input 
            type='file'
            className='drop-input'
            accept='.jpg, .jpeg, .png'
            disabled={!isSignedIn}
            onChange={handleFileChange}
          />
          <div className='drop-content'>
            <div className='drop-icon'>
              <UploadIcon size={20}/>
            </div>
            <p>{isSignedIn ? (
              "Click to upload or drag and drop files here"
            ) : ("Sign in or sign up with Puter to upload")}</p>

            <p className='help'>Maximum file size 50 MB.</p>
          </div>
        </div>
      ) : (
        <div className='upload-status'>
          <div className='status-content'>
            <div className='status-icon'>
              {progress === 100 ? (
                <CheckCircle2 className='check' />
              ): (
                <ImageIcon className='check'/>
              )}
            </div>

            <h3>{file.name}</h3>
            <div className='progress'>
              <div className='bar' style={{ width: `${progress}%`}} />

              <p className='status-text'>{ progress < 100 ? 'Analyzing Floor Plan...' : 'Redirecting...'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Upload
