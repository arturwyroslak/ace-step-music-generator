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
import { Loader2, Music, Sparkles, Download } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useMusicGeneration } from '@/hooks/useMusicGeneration'

export function GenerationPanel() {
  const [description, setDescription] = useState('')
  const [instrumental, setInstrumental] = useState(false)
  const [vocalLanguage, setVocalLanguage] = useState('english')
  const [temperature, setTemperature] = useState(0.85)
  const [topK, setTopK] = useState(0)
  const [topP, setTopP] = useState(0.9)

  const { generate, isGenerating, progress, result, error } = useMusicGeneration()

  const handleGenerate = async () => {
    if (!description.trim()) {
      return
    }

    try {
      await generate({
        description,
        instrumental,
        vocalLanguage,
        temperature,
        topK,
        topP,
      })
    } catch (err) {
      console.error('Generation failed:', err)
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
            Describe your music and AI will generate complete audio files
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Song Description</Label>
            <Textarea
              id="description"
              placeholder="e.g., upbeat pop song with catchy melody and electronic beats"
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
                  <SelectItem value="unknown">Unknown/Auto-detect</SelectItem>
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
                {progress || 'Generating...'}
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Generate Music
              </>
            )}
          </Button>

          {/* Progress */}
          {isGenerating && progress && (
            <Alert>
              <AlertDescription>{progress}</AlertDescription>
            </Alert>
          )}

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
                <CardTitle className="text-lg">✅ Music Generated!</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Audio Players */}
                {result.audioUrls && result.audioUrls.length > 0 && (
                  <div className="space-y-3">
                    <Label className="font-semibold">Generated Audio Files:</Label>
                    {result.audioUrls.map((url: string, idx: number) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Variation {idx + 1}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(url, '_blank')}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </Button>
                        </div>
                        <audio controls className="w-full">
                          <source src={url} type="audio/flac" />
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                    ))}
                  </div>
                )}

                {/* Metadata Display */}
                <div className="grid grid-cols-2 gap-4 text-sm pt-4 border-t">
                  <div>
                    <span className="font-semibold">BPM:</span> {result.metadata.bpm}
                  </div>
                  <div>
                    <span className="font-semibold">Duration:</span> {result.metadata.duration}s
                  </div>
                  <div>
                    <span className="font-semibold">Key:</span> {result.metadata.keySignature}
                  </div>
                  <div>
                    <span className="font-semibold">Time Signature:</span> {result.metadata.timeSignature}
                  </div>
                  <div className="col-span-2">
                    <span className="font-semibold">Language:</span> {result.metadata.vocalLanguage}
                  </div>
                </div>

                {/* Prompt */}
                <div className="space-y-2">
                  <Label className="font-semibold">Generated Prompt:</Label>
                  <p className="text-sm text-muted-foreground bg-background p-3 rounded-md">
                    {result.metadata.prompt}
                  </p>
                </div>

                {/* Lyrics */}
                {result.metadata.lyrics && (
                  <div className="space-y-2">
                    <Label className="font-semibold">Lyrics:</Label>
                    <pre className="text-sm text-muted-foreground bg-background p-3 rounded-md whitespace-pre-wrap font-mono">
                      {result.metadata.lyrics}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
