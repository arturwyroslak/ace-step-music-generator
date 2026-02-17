'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Music, Sparkles, ExternalLink } from 'lucide-react'
import { generationAPI } from '@/lib/api/client'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function GenerationPanel() {
  const [description, setDescription] = useState('')
  const [instrumental, setInstrumental] = useState(false)
  const [vocalLanguage, setVocalLanguage] = useState('english')
  const [temperature, setTemperature] = useState(0.85)
  const [topK, setTopK] = useState(0)
  const [topP, setTopP] = useState(0.9)
  const [thinking, setThinking] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)

  const handleGenerate = async () => {
    if (!description.trim()) {
      setError('Please enter a song description')
      return
    }

    setIsGenerating(true)
    setError(null)
    setResult(null)

    try {
      console.log('🎵 Starting generation...')
      const response = await generationAPI.generateSimple(
        description,
        instrumental,
        vocalLanguage,
        temperature,
        topK,
        topP,
        thinking
      )

      console.log('✅ Generation response:', response)
      setResult(response)

    } catch (err: any) {
      console.error('❌ Generation failed:', err)
      setError(err.message || 'Failed to generate music metadata')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            Simple Mode Generation
          </CardTitle>
          <CardDescription>
            Describe your music and AI will generate detailed metadata
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Song Description</Label>
            <Textarea
              id="description"
              placeholder="e.g., upbeat pop song with catchy melody"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Instrumental */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="instrumental"
              checked={instrumental}
              onCheckedChange={(checked) => setInstrumental(checked as boolean)}
            />
            <Label htmlFor="instrumental">Instrumental (no vocals)</Label>
          </div>

          {/* Vocal Language */}
          {!instrumental && (
            <div className="space-y-2">
              <Label htmlFor="vocalLanguage">Vocal Language</Label>
              <Select value={vocalLanguage} onValueChange={setVocalLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="spanish">Spanish</SelectItem>
                  <SelectItem value="french">French</SelectItem>
                  <SelectItem value="german">German</SelectItem>
                  <SelectItem value="italian">Italian</SelectItem>
                  <SelectItem value="portuguese">Portuguese</SelectItem>
                  <SelectItem value="chinese">Chinese</SelectItem>
                  <SelectItem value="japanese">Japanese</SelectItem>
                  <SelectItem value="korean">Korean</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Advanced Settings */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-semibold">Advanced Settings</h3>

            {/* Temperature */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Temperature</Label>
                <span className="text-sm text-muted-foreground">{temperature.toFixed(2)}</span>
              </div>
              <Slider
                value={[temperature]}
                onValueChange={([v]) => setTemperature(v)}
                min={0.1}
                max={1.5}
                step={0.05}
              />
            </div>

            {/* Top-K */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Top-K</Label>
                <span className="text-sm text-muted-foreground">{topK}</span>
              </div>
              <Slider
                value={[topK]}
                onValueChange={([v]) => setTopK(v)}
                min={0}
                max={100}
                step={1}
              />
            </div>

            {/* Top-P */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Top-P</Label>
                <span className="text-sm text-muted-foreground">{topP.toFixed(2)}</span>
              </div>
              <Slider
                value={[topP]}
                onValueChange={([v]) => setTopP(v)}
                min={0.1}
                max={1.0}
                step={0.05}
              />
            </div>

            {/* Thinking Mode */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="thinking"
                checked={thinking}
                onCheckedChange={(checked) => setThinking(checked as boolean)}
              />
              <Label htmlFor="thinking">Enable Thinking Mode (slower but more creative)</Label>
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !description.trim()}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generating Metadata...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Generate Music Metadata
              </>
            )}
          </Button>

          {/* Error */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Result */}
          {result && (
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-lg">✅ Metadata Generated!</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Metadata Display */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-semibold">BPM:</span> {result.bpm}
                  </div>
                  <div>
                    <span className="font-semibold">Duration:</span> {result.duration}s
                  </div>
                  <div>
                    <span className="font-semibold">Key:</span> {result.key}
                  </div>
                  <div>
                    <span className="font-semibold">Time Signature:</span> {result.timeSig}
                  </div>
                  <div className="col-span-2">
                    <span className="font-semibold">Language:</span> {result.vocalLanguage}
                  </div>
                </div>

                {/* Prompt */}
                <div className="space-y-2">
                  <Label className="font-semibold">Generated Prompt:</Label>
                  <p className="text-sm text-muted-foreground bg-background p-3 rounded-md">
                    {result.prompt}
                  </p>
                </div>

                {/* Lyrics */}
                <div className="space-y-2">
                  <Label className="font-semibold">Lyrics:</Label>
                  <pre className="text-sm text-muted-foreground bg-background p-3 rounded-md whitespace-pre-wrap font-mono">
                    {result.lyrics}
                  </pre>
                </div>

                {/* Audio Generation Link */}
                <Alert>
                  <Music className="h-4 w-4" />
                  <AlertDescription className="ml-2">
                    <div className="space-y-2">
                      <p className="font-semibold">Ready to generate audio?</p>
                      <p className="text-sm">
                        Visit the HuggingFace Space to generate actual audio files with these settings.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => window.open(result.audioGenerationURL, '_blank')}
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open in HuggingFace Space
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
