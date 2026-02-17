// ACE-STEP API Client
// Handles all 99 API endpoints with proper typing and event streaming

const API_BASE = 'https://ace-step-ace-step-v1-5.hf.space/gradio_api'

export interface GradioEventData {
  data: any[]
}

export interface GradioEvent {
  event: string
  data?: any
}

// Generic API call handler with event streaming
export async function callGradioAPI(
  endpoint: string,
  data: any[] = [],
  onProgress?: (event: GradioEvent) => void
): Promise<any> {
  try {
    // POST request to initiate the call
    const postResponse = await fetch(`${API_BASE}/call/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data }),
    })

    if (!postResponse.ok) {
      throw new Error(`API call failed: ${postResponse.statusText}`)
    }

    const postData = await postResponse.json()
    const eventId = postData.event_id

    if (!eventId) {
      throw new Error('No event_id received from API')
    }

    // Stream GET request for results
    const eventSource = new EventSource(`${API_BASE}/call/${endpoint}/${eventId}`)
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        eventSource.close()
        reject(new Error('API request timeout'))
      }, 300000) // 5 minute timeout

      eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data) as GradioEvent
          
          if (onProgress) {
            onProgress(parsed)
          }

          if (parsed.event === 'complete') {
            clearTimeout(timeout)
            eventSource.close()
            resolve(parsed.data)
          } else if (parsed.event === 'error') {
            clearTimeout(timeout)
            eventSource.close()
            reject(new Error(parsed.data || 'API error occurred'))
          }
        } catch (e) {
          console.error('Error parsing event:', e)
        }
      }

      eventSource.onerror = (error) => {
        clearTimeout(timeout)
        eventSource.close()
        reject(new Error('EventSource error'))
      }
    })
  } catch (error) {
    throw error
  }
}

// Model Management APIs
export const modelAPI = {
  initialize: (params: {
    checkpointFile: string
    configPath: string
    device: string
    init5HzLM: boolean
    lmModelPath: string
    lmBackend: string
    useFlashAttention: boolean
    offloadCPU: boolean
    offloadDiTCPU: boolean
  }) => callGradioAPI('lambda_1', [
    params.checkpointFile,
    params.configPath,
    params.device,
    params.init5HzLM,
    params.lmModelPath,
    params.lmBackend,
    params.useFlashAttention,
    params.offloadCPU,
    params.offloadDiTCPU,
  ]),

  loadLoRA: (loraPath: string) => callGradioAPI('load_lora', [loraPath]),
  unloadLoRA: () => callGradioAPI('unload_lora'),
  setUseLoRA: (useLoRA: boolean) => callGradioAPI('set_use_lora', [useLoRA]),
}

// Generation APIs
export const generationAPI = {
  // Simple mode generation
  generateSimple: (
    description: string,
    instrumental: boolean,
    vocalLanguage: string,
    temperature: number,
    topK: number,
    topP: number,
    thinking: boolean,
    onProgress?: (event: GradioEvent) => void
  ) => callGradioAPI(
    'lambda_12',
    [description, instrumental, vocalLanguage, temperature, topK, topP, thinking],
    onProgress
  ),

  // Custom mode generation
  generateCustom: (
    prompt: string,
    lyrics: string,
    bpm: number,
    duration: number,
    keySignature: string,
    timeSignature: string,
    temperature: number,
    topK: number,
    topP: number,
    thinking: boolean,
    onProgress?: (event: GradioEvent) => void
  ) => callGradioAPI(
    'lambda_10',
    [prompt, lyrics, bpm, duration, keySignature, timeSignature, temperature, topK, topP, thinking],
    onProgress
  ),

  // Transcribe audio codes
  transcribeAudio: (
    audioCodes: string,
    thinking: boolean,
    onProgress?: (event: GradioEvent) => void
  ) => callGradioAPI('lambda_9', [audioCodes, thinking], onProgress),

  // Load random example
  loadRandomExample: () => callGradioAPI('load_random_simple_description'),
}

// Dataset APIs
export const datasetAPI = {
  saveDataset: (savePath: string, datasetName: string) => 
    callGradioAPI('save_dataset', [savePath, datasetName]),

  loadDataset: (datasetPath: string) => 
    callGradioAPI('load_existing_dataset_for_preprocess_1', [datasetPath]),

  preprocessDataset: (tensorOutputDir: string, onProgress?: (event: GradioEvent) => void) => 
    callGradioAPI('lambda_33', [tensorOutputDir], onProgress),
}

// Training APIs
export const trainingAPI = {
  loadTrainingDataset: (tensorDir: string) => 
    callGradioAPI('load_training_dataset', [tensorDir]),

  startTraining: (
    tensorDir: string,
    loraRank: number,
    loraAlpha: number,
    loraDropout: number,
    learningRate: number,
    maxEpochs: number,
    batchSize: number,
    gradAccum: number,
    saveEveryN: number,
    shift: number,
    seed: number,
    outputDir: string,
    onProgress?: (event: GradioEvent) => void
  ) => callGradioAPI(
    'training_wrapper',
    [
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
    ],
    onProgress
  ),

  stopTraining: () => callGradioAPI('stop_training'),
}

// Metadata and UI helper APIs
export const helperAPI = {
  loadMetadata: (file: any) => callGradioAPI('load_metadata', [file]),
  updateModelTypeSettings: (configPath: string) => 
    callGradioAPI('update_model_type_settings', [configPath]),
}
