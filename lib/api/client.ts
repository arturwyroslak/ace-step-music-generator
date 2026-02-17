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

// Polling fallback when EventSource fails
async function pollForResult(
  endpoint: string,
  eventId: string,
  onProgress?: (event: GradioEvent) => void,
  maxAttempts = 60,
  intervalMs = 5000
): Promise<any> {
  let attempts = 0
  
  while (attempts < maxAttempts) {
    try {
      const response = await fetch(`${API_BASE}/call/${endpoint}/${eventId}`)
      
      if (!response.ok) {
        throw new Error(`Polling failed: ${response.statusText}`)
      }

      const text = await response.text()
      
      // Parse multiple events separated by newlines
      const lines = text.trim().split('\n')
      
      for (const line of lines) {
        if (!line.trim() || !line.startsWith('data: ')) continue
        
        try {
          const jsonStr = line.substring(6) // Remove 'data: ' prefix
          const parsed = JSON.parse(jsonStr) as GradioEvent
          
          if (onProgress) {
            onProgress(parsed)
          }

          if (parsed.event === 'complete') {
            return parsed.data
          } else if (parsed.event === 'error') {
            throw new Error(parsed.data || 'API error occurred')
          }
        } catch (e) {
          // Ignore parse errors for individual lines
          console.warn('Failed to parse event:', line, e)
        }
      }
      
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, intervalMs))
      attempts++
      
    } catch (error) {
      console.error('Polling error:', error)
      attempts++
      
      if (attempts >= maxAttempts) {
        throw new Error('Polling timeout - max attempts reached')
      }
      
      await new Promise(resolve => setTimeout(resolve, intervalMs))
    }
  }
  
  throw new Error('Polling timeout')
}

// Generic API call handler with event streaming and polling fallback
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

    console.log(`API call started: ${endpoint}, event_id: ${eventId}`)

    // Try EventSource first
    return new Promise((resolve, reject) => {
      let eventSourceFailed = false
      const eventSource = new EventSource(`${API_BASE}/call/${endpoint}/${eventId}`)
      
      const timeout = setTimeout(() => {
        eventSource.close()
        if (!eventSourceFailed) {
          console.log('EventSource timeout, switching to polling...')
          eventSourceFailed = true
          
          // Fallback to polling
          pollForResult(endpoint, eventId, onProgress)
            .then(resolve)
            .catch(reject)
        }
      }, 10000) // 10 second timeout for EventSource

      eventSource.onmessage = (event) => {
        clearTimeout(timeout)
        
        try {
          const parsed = JSON.parse(event.data) as GradioEvent
          
          if (onProgress) {
            onProgress(parsed)
          }

          if (parsed.event === 'complete') {
            eventSource.close()
            resolve(parsed.data)
          } else if (parsed.event === 'error') {
            eventSource.close()
            reject(new Error(parsed.data || 'API error occurred'))
          }
        } catch (e) {
          console.error('Error parsing event:', e)
        }
      }

      eventSource.onerror = (error) => {
        console.log('EventSource error:', error)
        
        if (!eventSourceFailed) {
          eventSourceFailed = true
          clearTimeout(timeout)
          eventSource.close()
          
          console.log('EventSource failed, switching to polling...')
          
          // Fallback to polling
          pollForResult(endpoint, eventId, onProgress)
            .then(resolve)
            .catch(reject)
        }
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
