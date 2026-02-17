'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { datasetAPI } from '@/lib/api/client'
import { Database, Loader2, Save, FolderOpen, FileAudio } from 'lucide-react'

export function DatasetManager() {
  const [savePath, setSavePath] = useState('./datasets/my_dataset.json')
  const [datasetName, setDatasetName] = useState('my_dataset')
  const [loadPath, setLoadPath] = useState('')
  const [tensorOutputDir, setTensorOutputDir] = useState('./datasets/preprocessed_tensors')
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isPreprocessing, setIsPreprocessing] = useState(false)
  const [status, setStatus] = useState('')

  const handleSaveDataset = async () => {
    if (!savePath.trim() || !datasetName.trim()) {
      alert('Please provide both save path and dataset name')
      return
    }

    setIsSaving(true)
    setStatus('Saving dataset...')

    try {
      const result = await datasetAPI.saveDataset(savePath, datasetName)
      setStatus(typeof result === 'string' ? result : 'Dataset saved successfully')
    } catch (error) {
      console.error('Save failed:', error)
      setStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleLoadDataset = async () => {
    if (!loadPath.trim()) {
      alert('Please provide a dataset path')
      return
    }

    setIsLoading(true)
    setStatus('Loading dataset...')

    try {
      const result = await datasetAPI.loadDataset(loadPath)
      if (result && Array.isArray(result)) {
        setStatus(`Dataset loaded: ${result[0] || 'Success'}`)
      } else {
        setStatus('Dataset loaded successfully')
      }
    } catch (error) {
      console.error('Load failed:', error)
      setStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePreprocessDataset = async () => {
    if (!tensorOutputDir.trim()) {
      alert('Please provide tensor output directory')
      return
    }

    setIsPreprocessing(true)
    setStatus('Preprocessing dataset...')

    try {
      const result = await datasetAPI.preprocessDataset(
        tensorOutputDir,
        (event) => {
          if (event.event === 'progress' && event.data) {
            setStatus(`Processing: ${event.data}`)
          }
        }
      )
      setStatus(typeof result === 'string' ? result : 'Preprocessing complete')
    } catch (error) {
      console.error('Preprocessing failed:', error)
      setStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsPreprocessing(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Dataset Management
          </CardTitle>
          <CardDescription>
            Manage audio datasets for LoRA training
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Save className="h-4 w-4" />
              Save Dataset
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="savePath">Save Path</Label>
              <Input
                id="savePath"
                value={savePath}
                onChange={(e) => setSavePath(e.target.value)}
                placeholder="./datasets/my_dataset.json"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="datasetName">Dataset Name</Label>
              <Input
                id="datasetName"
                value={datasetName}
                onChange={(e) => setDatasetName(e.target.value)}
                placeholder="my_dataset"
              />
            </div>

            <Button
              onClick={handleSaveDataset}
              disabled={isSaving}
              className="w-full gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Dataset
                </>
              )}
            </Button>
          </div>

          <div className="h-px bg-border" />

          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Load Dataset
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="loadPath">Dataset Path</Label>
              <Input
                id="loadPath"
                value={loadPath}
                onChange={(e) => setLoadPath(e.target.value)}
                placeholder="./datasets/my_dataset.json"
              />
            </div>

            <Button
              onClick={handleLoadDataset}
              disabled={isLoading}
              className="w-full gap-2"
              variant="outline"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <FolderOpen className="h-4 w-4" />
                  Load Dataset
                </>
              )}
            </Button>
          </div>

          <div className="h-px bg-border" />

          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileAudio className="h-4 w-4" />
              Preprocess Dataset
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="tensorOutputDir">Tensor Output Directory</Label>
              <Input
                id="tensorOutputDir"
                value={tensorOutputDir}
                onChange={(e) => setTensorOutputDir(e.target.value)}
                placeholder="./datasets/preprocessed_tensors"
              />
            </div>

            <Button
              onClick={handlePreprocessDataset}
              disabled={isPreprocessing}
              className="w-full gap-2"
            >
              {isPreprocessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Preprocessing...
                </>
              ) : (
                <>
                  <FileAudio className="h-4 w-4" />
                  Preprocess Dataset
                </>
              )}
            </Button>
          </div>

          {status && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium">{status}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dataset Instructions</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <ol className="space-y-2">
            <li>Organize your audio files in a directory structure</li>
            <li>Use the scan function to detect and label audio files</li>
            <li>Edit metadata (caption, lyrics, BPM, key, etc.) for each sample</li>
            <li>Save the dataset to a JSON file</li>
            <li>Preprocess the dataset to convert audio to tensors</li>
            <li>Use the preprocessed tensors for LoRA training</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
