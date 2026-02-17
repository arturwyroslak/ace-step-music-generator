'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Progress } from '@/components/ui/progress'
import { useGenerationStore } from '@/lib/store/generation'
import { generationAPI, GradioEvent } from '@/lib/api/client'
import { Download, Loader2, Music, Sparkles, Shuffle, Clock, CheckCircle2 } from 'lucide-react'
import { parseAudioURL } from '@/lib/utils'

interface ProgressState {
  stage: string
  progress: number
  message: string
  details?: string
}

export function GenerationPanel() {
  const [generationMode, setGenerationMode] = useState<'simple' | 'custom'>('simple')
  const store = useGenerationStore()
  const [audioResults, setAudioResults] = useState<string[]>([])
  const [progressState, setProgressState] = useState<ProgressState>({
    stage: 'idle',
    progress: 0,
    message: '',
  })

  const updateProgress = (event: GradioEvent) => {
    if (event.event === 'generating') {
      setProgressState({
        stage: 'generating',
        progress: 30,
        message: 'Generating music...',
        details: 'Processing your request',
      })
    } else if (event.event === 'progress') {
      const progress = event.data?.progress || 50
      setProgressState({
        stage: 'processing',
        progress: Math.min(progress, 90),
        message: 'Processing audio...',
        details: event.data?.message || 'Creating your music',
      })
    } else if (event.event === 'heartbeat') {
      setProgressState(prev => ({
        ...prev,
        progress: Math.min(prev.progress + 2, 95),
        details: 'Still working...',
      }))
    }
  }

  const handleGenerateSimple = async () => {
    if (!store.description.trim()) {
      alert('Please enter a description')
      return
    }

    store.setIsGenerating(true)
    store.clearGeneratedAudios()
    setAudioResults([])
    setProgressState({
      stage: 'starting',
      progress: 10,
      message: 'Initializing generation...',
      details: 'Connecting to API',
    })

    try {
      const result = await generationAPI.generateSimple(
        store.description,
        store.instrumental,
        store.vocalLanguage,
        store.temperature,
        store.topK,
        store.topP,
        store.thinking,
        updateProgress
      )

      setProgressState({
        stage: 'complete',
        progress: 100,
        message: 'Generation complete!',
        details: 'Music created successfully',
      })

      // Parse result
      if (result && Array.isArray(result)) {
        const [prompt, lyrics, bpm, duration, key, vocal, timeSig, ...rest] = result
        store.setPrompt(prompt || '')
        store.setLyrics(lyrics || '')
        store.setBPM(bpm || 0)
        store.setDuration(duration || 0)
        store.setKeySignature(key || '')
        store.setTimeSignature(timeSig || '')
      }

      store.setGenerationStatus('✅ Generation complete!')
    } catch (error) {
      console.error('Generation failed:', error)
      setProgressState({
        stage: 'error',
        progress: 0,
        message: 'Generation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      })
      store.setGenerationStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      store.setIsGenerating(false)
    }
  }

  const handleGenerateCustom = async () => {
    if (!store.prompt.trim()) {
      alert('Please enter a prompt')
      return
    }

    store.setIsGenerating(true)
    store.clearGeneratedAudios()
    setAudioResults([])
    setProgressState({
      stage: 'starting',
      progress: 10,
      message: 'Initializing generation...',
      details: 'Preparing custom parameters',
    })

    try {
      const result = await generationAPI.generateCustom(
        store.prompt,
        store.lyrics,
        store.bpm,
        store.duration,
        store.keySignature,
        store.timeSignature,
        store.temperature,
        store.topK,
        store.topP,
        store.thinking,
        updateProgress
      )

      setProgressState({
        stage: 'complete',
        progress: 100,
        message: 'Generation complete!',
        details: 'Music created successfully',
      })

      if (result && Array.isArray(result)) {
        const [updatedPrompt, updatedLyrics, updatedBpm, updatedDuration, updatedKey, updatedVocal, updatedTimeSig, status] = result
        store.setGenerationStatus(status || '✅ Complete!')
      }
    } catch (error) {
      console.error('Generation failed:', error)
      setProgressState({
        stage: 'error',
        progress: 0,
        message: 'Generation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      })
      store.setGenerationStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      store.setIsGenerating(false)
    }
  }

  const loadRandomExample = async () => {
    try {
      const result = await generationAPI.loadRandomExample()
      if (result && Array.isArray(result)) {
        const [description, instrumental, vocalLang] = result
        store.setDescription(description || '')
        store.setInstrumental(instrumental || false)
        store.setVocalLanguage(vocalLang || 'english')
      }
    } catch (error) {
      console.error('Failed to load example:', error)
    }
  }

  const getProgressColor = () => {
    if (progressState.stage === 'error') return 'bg-red-500'
    if (progressState.stage === 'complete') return 'bg-green-500'
    return 'bg-blue-500'
  }

  const getStageIcon = () => {
    switch (progressState.stage) {
      case 'complete':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'error':
        return <div className="h-5 w-5 rounded-full bg-red-500" />
      case 'idle':
        return <Music className="h-5 w-5 text-muted-foreground" />
      default:
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            Music Generation
          </CardTitle>
          <CardDescription>
            Generate AI music with simple descriptions or detailed controls
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={generationMode} onValueChange={(v) => setGenerationMode(v as any)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="simple">Simple Mode</TabsTrigger>
              <TabsTrigger value="custom">Custom Mode</TabsTrigger>
            </TabsList>

            <TabsContent value="simple" className="space-y-4 mt-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="description">Song Description</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadRandomExample}
                    className="gap-2"
                    disabled={store.isGenerating}
                  >
                    <Shuffle className="h-4 w-4" />
                    Random Example
                  </Button>
                </div>
                <Textarea
                  id="description"
                  placeholder="Describe your music... e.g., 'upbeat pop song with catchy melody'"
                  value={store.description}
                  onChange={(e) => store.setDescription(e.target.value)}
                  rows={4}
                  disabled={store.isGenerating}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="instrumental"
                  checked={store.instrumental}
                  onCheckedChange={(checked) => store.setInstrumental(checked as boolean)}
                  disabled={store.isGenerating}
                />
                <Label htmlFor="instrumental">Instrumental (no vocals)</Label>
              </div>

              {!store.instrumental && (
                <div className="space-y-2">
                  <Label htmlFor="vocalLanguage">Vocal Language</Label>
                  <Select 
                    value={store.vocalLanguage} 
                    onValueChange={store.setVocalLanguage}
                    disabled={store.isGenerating}
                  >
                    <SelectTrigger id="vocalLanguage">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="english">English</SelectItem>
                      <SelectItem value="spanish">Spanish</SelectItem>
                      <SelectItem value="french">French</SelectItem>
                      <SelectItem value="german">German</SelectItem>
                      <SelectItem value="italian">Italian</SelectItem>
                      <SelectItem value="japanese">Japanese</SelectItem>
                      <SelectItem value="korean">Korean</SelectItem>
                      <SelectItem value="chinese">Chinese</SelectItem>
                      <SelectItem value="unknown">Auto-detect</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button
                onClick={handleGenerateSimple}
                disabled={store.isGenerating || !store.description.trim()}
                className="w-full gap-2"
                size="lg"
              >
                {store.isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Music
                  </>
                )}
              </Button>
            </TabsContent>

            <TabsContent value="custom" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="prompt">Prompt</Label>
                <Textarea
                  id="prompt"
                  placeholder="Detailed music prompt..."
                  value={store.prompt}
                  onChange={(e) => store.setPrompt(e.target.value)}
                  rows={3}
                  disabled={store.isGenerating}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lyrics">Lyrics (optional)</Label>
                <Textarea
                  id="lyrics"
                  placeholder="Song lyrics..."
                  value={store.lyrics}
                  onChange={(e) => store.setLyrics(e.target.value)}
                  rows={6}
                  disabled={store.isGenerating}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bpm">BPM (0 = auto)</Label>
                  <Input
                    id="bpm"
                    type="number"
                    value={store.bpm}
                    onChange={(e) => store.setBPM(Number(e.target.value))}
                    min={0}
                    max={300}
                    disabled={store.isGenerating}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (seconds, -1 = auto)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={store.duration}
                    onChange={(e) => store.setDuration(Number(e.target.value))}
                    min={-1}
                    max={300}
                    disabled={store.isGenerating}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="key">Key Signature (optional)</Label>
                  <Input
                    id="key"
                    placeholder="e.g., C major, A minor"
                    value={store.keySignature}
                    onChange={(e) => store.setKeySignature(e.target.value)}
                    disabled={store.isGenerating}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeSig">Time Signature</Label>
                  <Select 
                    value={store.timeSignature} 
                    onValueChange={store.setTimeSignature}
                    disabled={store.isGenerating}
                  >
                    <SelectTrigger id="timeSig">
                      <SelectValue placeholder="Auto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Auto</SelectItem>
                      <SelectItem value="4/4">4/4</SelectItem>
                      <SelectItem value="3/4">3/4</SelectItem>
                      <SelectItem value="6/8">6/8</SelectItem>
                      <SelectItem value="5/4">5/4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleGenerateCustom}
                disabled={store.isGenerating || !store.prompt.trim()}
                className="w-full gap-2"
                size="lg"
              >
                {store.isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Music
                  </>
                )}
              </Button>
            </TabsContent>
          </Tabs>

          <Separator className="my-6" />

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="advanced">
              <AccordionTrigger>Advanced Settings</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Temperature: {store.temperature.toFixed(2)}</Label>
                  </div>
                  <Slider
                    value={[store.temperature]}
                    onValueChange={(v) => store.setTemperature(v[0])}
                    min={0}
                    max={2}
                    step={0.05}
                    disabled={store.isGenerating}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Top-K: {store.topK}</Label>
                  </div>
                  <Slider
                    value={[store.topK]}
                    onValueChange={(v) => store.setTopK(v[0])}
                    min={0}
                    max={100}
                    step={1}
                    disabled={store.isGenerating}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Top-P: {store.topP.toFixed(2)}</Label>
                  </div>
                  <Slider
                    value={[store.topP]}
                    onValueChange={(v) => store.setTopP(v[0])}
                    min={0}
                    max={1}
                    step={0.05}
                    disabled={store.isGenerating}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="thinking"
                    checked={store.thinking}
                    onCheckedChange={(checked) => store.setThinking(checked as boolean)}
                    disabled={store.isGenerating}
                  />
                  <Label htmlFor="thinking">Enable extended thinking mode</Label>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Progress Display */}
          {store.isGenerating && (
            <Card className="mt-6 border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    {getStageIcon()}
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">{progressState.message}</span>
                        <span className="text-xs text-muted-foreground">{progressState.progress}%</span>
                      </div>
                      <Progress 
                        value={progressState.progress} 
                        className="h-2"
                      />
                      {progressState.details && (
                        <p className="text-xs text-muted-foreground mt-2">
                          {progressState.details}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Animated dots */}
                  <div className="flex justify-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>

                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>This may take a few minutes...</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status Message */}
          {!store.isGenerating && store.generationStatus && (
            <Card className={`mt-6 ${
              progressState.stage === 'complete' 
                ? 'border-green-500/50 bg-green-50/50 dark:bg-green-950/20' 
                : progressState.stage === 'error'
                ? 'border-red-500/50 bg-red-50/50 dark:bg-red-950/20'
                : 'border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20'
            }`}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  {getStageIcon()}
                  <p className="text-sm font-medium">{store.generationStatus}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {store.generatedAudios.length > 0 && (
            <div className="mt-6 space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Music className="h-4 w-4" />
                Generated Music
              </h3>
              <div className="grid gap-4">
                {store.generatedAudios.map((audio, idx) => (
                  <Card key={idx}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Sample {audio.index + 1}</span>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Download className="h-4 w-4" />
                          Download
                        </Button>
                      </div>
                      <audio controls src={audio.url} className="w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
