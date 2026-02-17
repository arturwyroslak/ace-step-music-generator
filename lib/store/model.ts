import { create } from 'zustand'

interface ModelState {
  // Model configuration
  checkpointFile: string
  configPath: string
  device: string
  init5HzLM: boolean
  lmModelPath: string
  lmBackend: string
  useFlashAttention: boolean
  offloadCPU: boolean
  offloadDiTCPU: boolean

  // LoRA configuration
  loraPath: string
  useLoRA: boolean
  loraLoaded: boolean

  // Model state
  isInitialized: boolean
  isInitializing: boolean
  modelStatus: string
  loraStatus: string

  // Actions
  setCheckpointFile: (file: string) => void
  setConfigPath: (path: string) => void
  setDevice: (device: string) => void
  setInit5HzLM: (init: boolean) => void
  setLmModelPath: (path: string) => void
  setLmBackend: (backend: string) => void
  setUseFlashAttention: (use: boolean) => void
  setOffloadCPU: (offload: boolean) => void
  setOffloadDiTCPU: (offload: boolean) => void
  setLoraPath: (path: string) => void
  setUseLoRA: (use: boolean) => void
  setLoraLoaded: (loaded: boolean) => void
  setIsInitialized: (initialized: boolean) => void
  setIsInitializing: (initializing: boolean) => void
  setModelStatus: (status: string) => void
  setLoraStatus: (status: string) => void
  reset: () => void
}

const initialState = {
  checkpointFile: '/data/checkpoints',
  configPath: 'acestep-v15-turbo',
  device: 'auto',
  init5HzLM: true,
  lmModelPath: 'acestep-5Hz-lm-1.7B',
  lmBackend: 'vllm',
  useFlashAttention: true,
  offloadCPU: false,
  offloadDiTCPU: false,
  loraPath: '',
  useLoRA: false,
  loraLoaded: false,
  isInitialized: false,
  isInitializing: false,
  modelStatus: 'Not initialized',
  loraStatus: 'No LoRA loaded',
}

export const useModelStore = create<ModelState>((set) => ({
  ...initialState,

  setCheckpointFile: (checkpointFile) => set({ checkpointFile }),
  setConfigPath: (configPath) => set({ configPath }),
  setDevice: (device) => set({ device }),
  setInit5HzLM: (init5HzLM) => set({ init5HzLM }),
  setLmModelPath: (lmModelPath) => set({ lmModelPath }),
  setLmBackend: (lmBackend) => set({ lmBackend }),
  setUseFlashAttention: (useFlashAttention) => set({ useFlashAttention }),
  setOffloadCPU: (offloadCPU) => set({ offloadCPU }),
  setOffloadDiTCPU: (offloadDiTCPU) => set({ offloadDiTCPU }),
  setLoraPath: (loraPath) => set({ loraPath }),
  setUseLoRA: (useLoRA) => set({ useLoRA }),
  setLoraLoaded: (loraLoaded) => set({ loraLoaded }),
  setIsInitialized: (isInitialized) => set({ isInitialized }),
  setIsInitializing: (isInitializing) => set({ isInitializing }),
  setModelStatus: (modelStatus) => set({ modelStatus }),
  setLoraStatus: (loraStatus) => set({ loraStatus }),
  reset: () => set(initialState),
}))
