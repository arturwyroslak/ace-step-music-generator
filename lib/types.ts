// Music Generation Types

export interface MusicGenerationParams {
  description: string
  instrumental?: boolean
  vocalLanguage?: string
  temperature?: number
  topK?: number
  topP?: number
  duration?: number
}

export interface MusicMetadata {
  prompt: string
  lyrics: string
  bpm: number
  duration: number
  keySignature: string
  timeSignature: string
  vocalLanguage: string
  instrumental: boolean
}

export interface GenerationResult {
  audioUrl: string | null
  audioUrls: string[]
  metadata: MusicMetadata
}

export interface AudioFile {
  url: string
  path: string
  size?: number
  orig_name?: string
  mime_type?: string
}
