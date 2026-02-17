import { create } from 'zustand'

interface GenerationState {
  // Simple mode
  description: string
  instrumental: boolean
  vocalLanguage: string

  // Custom mode
  prompt: string
  lyrics: string
  bpm: number
  duration: number
  keySignature: string
  timeSignature: string

  // Advanced settings
  temperature: number
  topK: number
  topP: number
  cfgScale: number
  ditSteps: number
  shift: number
  thinking: boolean
  randomSeed: boolean
  seed: string

  // Generation state
  isGenerating: boolean
  generationStatus: string
  generatedAudios: Array<{ url: string; index: number }>

  // Actions
  setDescription: (description: string) => void
  setInstrumental: (instrumental: boolean) => void
  setVocalLanguage: (language: string) => void
  setPrompt: (prompt: string) => void
  setLyrics: (lyrics: string) => void
  setBPM: (bpm: number) => void
  setDuration: (duration: number) => void
  setKeySignature: (key: string) => void
  setTimeSignature: (time: string) => void
  setTemperature: (temp: number) => void
  setTopK: (topK: number) => void
  setTopP: (topP: number) => void
  setCfgScale: (cfg: number) => void
  setDitSteps: (steps: number) => void
  setShift: (shift: number) => void
  setThinking: (thinking: boolean) => void
  setRandomSeed: (random: boolean) => void
  setSeed: (seed: string) => void
  setIsGenerating: (generating: boolean) => void
  setGenerationStatus: (status: string) => void
  addGeneratedAudio: (url: string, index: number) => void
  clearGeneratedAudios: () => void
  reset: () => void
}

const initialState = {
  description: '',
  instrumental: false,
  vocalLanguage: 'english',
  prompt: '',
  lyrics: '',
  bpm: 0,
  duration: -1,
  keySignature: '',
  timeSignature: '',
  temperature: 0.85,
  topK: 0,
  topP: 0.9,
  cfgScale: 3.0,
  ditSteps: 8,
  shift: 1.0,
  thinking: false,
  randomSeed: true,
  seed: '42',
  isGenerating: false,
  generationStatus: '',
  generatedAudios: [],
}

export const useGenerationStore = create<GenerationState>((set) => ({
  ...initialState,

  setDescription: (description) => set({ description }),
  setInstrumental: (instrumental) => set({ instrumental }),
  setVocalLanguage: (vocalLanguage) => set({ vocalLanguage }),
  setPrompt: (prompt) => set({ prompt }),
  setLyrics: (lyrics) => set({ lyrics }),
  setBPM: (bpm) => set({ bpm }),
  setDuration: (duration) => set({ duration }),
  setKeySignature: (keySignature) => set({ keySignature }),
  setTimeSignature: (timeSignature) => set({ timeSignature }),
  setTemperature: (temperature) => set({ temperature }),
  setTopK: (topK) => set({ topK }),
  setTopP: (topP) => set({ topP }),
  setCfgScale: (cfgScale) => set({ cfgScale }),
  setDitSteps: (ditSteps) => set({ ditSteps }),
  setShift: (shift) => set({ shift }),
  setThinking: (thinking) => set({ thinking }),
  setRandomSeed: (randomSeed) => set({ randomSeed }),
  setSeed: (seed) => set({ seed }),
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  setGenerationStatus: (generationStatus) => set({ generationStatus }),
  addGeneratedAudio: (url, index) =>
    set((state) => ({
      generatedAudios: [...state.generatedAudios, { url, index }],
    })),
  clearGeneratedAudios: () => set({ generatedAudios: [] }),
  reset: () => set(initialState),
}))
