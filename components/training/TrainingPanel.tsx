'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { trainingAPI } from '@/lib/api/client'
import { GraduationCap, Loader2, Play, Square } from 'lucide-react'

export function TrainingPanel() {
  const [tensorDir, setTensorDir] = useState('./datasets/preprocessed_tensors')
  const [loraRank, setLoraRank] = useState(64)
  const [loraAlpha, setLoraAlpha] = useState(128)
  const [loraDropout, setLoraDropout] = useState(0.1)
  const [learningRate, setLearningRate] = useState(0.0001)
  const [maxEpochs, setMaxEpochs] = useState(500)
  const [batchSize, setBatchSize] = useState(1)
  const [gradAccum, setGradAccum] = useState(1)
  const [saveEveryN, setSaveEveryN] = useState(200)
  const [shift, setShift] = useState(3)
  const [seed, setSeed] = useState(42)
  const [outputDir, setOutputDir] = useState('./lora_output')
  
  const [isTraining, setIsTraining] = useState(false)
  const [trainingStatus, setTrainingStatus] = useState('')
  const [trainingLog, setTrainingLog] = useState('')

  const handleLoadDataset = async () => {
    try {
      const result = await trainingAPI.loadTrainingDataset(tensorDir)
      setTrainingStatus(typeof result === 'string' ? result : 'Dataset loaded')
    } catch (error) {
      console.error('Failed to load dataset:', error)
      setTrainingStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleStartTraining = async () => {
    setIsTraining(true)
    setTrainingStatus('Starting training...')
    setTrainingLog('')

    try {
      const result = await trainingAPI.startTraining(
        tensorDir,
        loraRank,
        loraAlpha,
        loraDropout,
        learningRate,
        maxEpochs,
        batchSize,
        gradAccum,
        saveEveryN,
        shift,
        seed,
        outputDir,
        (event) => {
          if (event.event === 'progress') {
            if (event.data && Array.isArray(event.data)) {
              const [status, log] = event.data
              if (status) setTrainingStatus(status)
              if (log) setTrainingLog(log)
            }
          }
        }
      )

      if (result && Array.isArray(result)) {
        const [status, log] = result
        setTrainingStatus(status || 'Training complete')
        if (log) setTrainingLog(log)
      }
    } catch (error) {
      console.error('Training failed:', error)
      setTrainingStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsTraining(false)
    }
  }

  const handleStopTraining = async () => {
    try {
      await trainingAPI.stopTraining()
      setTrainingStatus('Training stopped by user')
      setIsTraining(false)
    } catch (error) {
      console.error('Failed to stop training:', error)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            LoRA Training
          </CardTitle>
          <CardDescription>
            Fine-tune the model with custom datasets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tensorDir">Preprocessed Tensors Directory</Label>
              <Input
                id="tensorDir"
                value={tensorDir}
                onChange={(e) => setTensorDir(e.target.value)}
                placeholder="./datasets/preprocessed_tensors"
              />
            </div>

            <Button
              onClick={handleLoadDataset}
              disabled={isTraining}
              variant="outline"
              className="w-full"
            >
              Load Training Dataset
            </Button>
          </div>

          <div className="h-px bg-border" />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>LoRA Rank: {loraRank}</Label>
              <Slider
                value={[loraRank]}
                onValueChange={(v) => setLoraRank(v[0])}
                min={8}
                max={256}
                step={8}
                disabled={isTraining}
              />
            </div>

            <div className="space-y-2">
              <Label>LoRA Alpha: {loraAlpha}</Label>
              <Slider
                value={[loraAlpha]}
                onValueChange={(v) => setLoraAlpha(v[0])}
                min={16}
                max={512}
                step={16}
                disabled={isTraining}
              />
            </div>

            <div className="space-y-2">
              <Label>Dropout: {loraDropout.toFixed(2)}</Label>
              <Slider
                value={[loraDropout]}
                onValueChange={(v) => setLoraDropout(v[0])}
                min={0}
                max={0.5}
                step={0.05}
                disabled={isTraining}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="learningRate">Learning Rate</Label>
              <Input
                id="learningRate"
                type="number"
                value={learningRate}
                onChange={(e) => setLearningRate(Number(e.target.value))}
                step={0.00001}
                disabled={isTraining}
              />
            </div>

            <div className="space-y-2">
              <Label>Max Epochs: {maxEpochs}</Label>
              <Slider
                value={[maxEpochs]}
                onValueChange={(v) => setMaxEpochs(v[0])}
                min={10}
                max={1000}
                step={10}
                disabled={isTraining}
              />
            </div>

            <div className="space-y-2">
              <Label>Batch Size: {batchSize}</Label>
              <Slider
                value={[batchSize]}
                onValueChange={(v) => setBatchSize(v[0])}
                min={1}
                max={8}
                step={1}
                disabled={isTraining}
              />
            </div>

            <div className="space-y-2">
              <Label>Gradient Accumulation: {gradAccum}</Label>
              <Slider
                value={[gradAccum]}
                onValueChange={(v) => setGradAccum(v[0])}
                min={1}
                max={16}
                step={1}
                disabled={isTraining}
              />
            </div>

            <div className="space-y-2">
              <Label>Save Every N Epochs: {saveEveryN}</Label>
              <Slider
                value={[saveEveryN]}
                onValueChange={(v) => setSaveEveryN(v[0])}
                min={10}
                max={500}
                step={10}
                disabled={isTraining}
              />
            </div>

            <div className="space-y-2">
              <Label>Shift: {shift}</Label>
              <Slider
                value={[shift]}
                onValueChange={(v) => setShift(v[0])}
                min={1}
                max={10}
                step={1}
                disabled={isTraining}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="seed">Random Seed</Label>
              <Input
                id="seed"
                type="number"
                value={seed}
                onChange={(e) => setSeed(Number(e.target.value))}
                disabled={isTraining}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="outputDir">Output Directory</Label>
            <Input
              id="outputDir"
              value={outputDir}
              onChange={(e) => setOutputDir(e.target.value)}
              placeholder="./lora_output"
              disabled={isTraining}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleStartTraining}
              disabled={isTraining}
              className="flex-1 gap-2"
              size="lg"
            >
              {isTraining ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Training...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Start Training
                </>
              )}
            </Button>

            {isTraining && (
              <Button
                onClick={handleStopTraining}
                variant="destructive"
                className="gap-2"
                size="lg"
              >
                <Square className="h-4 w-4" />
                Stop
              </Button>
            )}
          </div>

          {trainingStatus && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium">{trainingStatus}</p>
            </div>
          )}

          {trainingLog && (
            <div className="p-4 bg-black text-green-400 rounded-lg font-mono text-xs max-h-64 overflow-y-auto">
              <pre>{trainingLog}</pre>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Training Tips</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <ul className="space-y-2">
            <li><strong>LoRA Rank:</strong> Higher rank = more capacity but slower training (64-128 recommended)</li>
            <li><strong>Learning Rate:</strong> Start with 0.0001 and adjust based on loss curve</li>
            <li><strong>Batch Size:</strong> Larger batches = more stable but require more VRAM</li>
            <li><strong>Gradient Accumulation:</strong> Simulates larger batches with less VRAM</li>
            <li><strong>Epochs:</strong> Monitor validation loss to avoid overfitting</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
