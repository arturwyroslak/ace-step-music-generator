// ACE-STEP API Client
// Handles all 99 API endpoints with proper typing and event streaming

const API_BASE = 'https://ace-step-ace-step-v1-5.hf.space'
const GRADIO_API = `${API_BASE}/gradio_api`

export interface GradioEventData {
  data: any[]
}

export interface GradioEvent {
  event: string
  data?: any
}

// Polling fallback when EventSource fails (CORS issues)
async function pollForResult(
  endpoint: string,
  eventId: string,
  onProgress?: (event: GradioEvent) => void
): Promise<any> {
  const maxAttempts = 600 // 5 minutes with 500ms intervals
  let attempts = 0

  while (attempts < maxAttempts) {
    try {
      const response = await fetch(`${GRADIO_API}/call/${endpoint}/${eventId}`)
      
      if (!response.ok) {
        throw new Error(`Polling failed: ${response.statusText}`)
      }

      const text = await response.text()
      const lines = text.split('\n').filter(line => line.trim())

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6))
            
            if (onProgress) {
              onProgress(data)
            }

            if (data.msg === 'process_completed') {
              return data.output?.data || data.output
            }

            if (data.msg === 'error') {
              throw new Error(data.error || 'API error occurred')
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }

      await new Promise(resolve => setTimeout(resolve, 500))
      attempts++
    } catch (error) {
      console.error('Polling error:', error)
      await new Promise(resolve => setTimeout(resolve, 1000))
      attempts++
    }
  }

  throw new Error('Request timeout - no result received')
}

// Generic API call handler with event streaming and fallback
export async function callGradioAPI(
  endpoint: string,
  data: any[] = [],
  onProgress?: (event: GradioEvent) => void
): Promise<any> {
  try {
    // POST request to initiate the call
    const postResponse = await fetch(`${GRADIO_API}/call/${endpoint}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
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

    // Try EventSource first, fall back to polling on error
    return new Promise((resolve, reject) => {
      let resolved = false
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true
          reject(new Error('API request timeout'))
        }
      }, 300000) // 5 minute timeout

      // Try to use EventSource
      try {
        const eventSource = new EventSource(
          `${GRADIO_API}/call/${endpoint}/${eventId}`
        )

        let hasError = false

        eventSource.onmessage = (event) => {
          try {
            const parsed = JSON.parse(event.data)
            
            if (onProgress && !resolved) {
              onProgress(parsed)
            }

            // Check for completion
            if (parsed.msg === 'process_completed') {
              if (!resolved) {
                resolved = true
                clearTimeout(timeout)
                eventSource.close()
                resolve(parsed.output?.data || parsed.output)
              }
            } else if (parsed.msg === 'error') {
              if (!resolved) {
                resolved = true
                clearTimeout(timeout)
                eventSource.close()
                reject(new Error(parsed.error || 'API error occurred'))
              }
            }
          } catch (e) {
            console.error('Error parsing event:', e)
          }
        }

        eventSource.onerror = (error) => {
          if (!hasError && !resolved) {
            hasError = true
            eventSource.close()
            
            console.log('EventSource failed, switching to polling...')
            
            // Fall back to polling
            pollForResult(endpoint, eventId, onProgress)
              .then(result => {
                if (!resolved) {
                  resolved = true
                  clearTimeout(timeout)
                  resolve(result)
                }
              })
              .catch(err => {
                if (!resolved) {
                  resolved = true
                  clearTimeout(timeout)
                  reject(err)
                }
              })
          }
        }
      } catch (e) {
        // If EventSource constructor fails, use polling
        console.log('EventSource not available, using polling...')
        
        pollForResult(endpoint, eventId, onProgress)
          .then(result => {
            if (!resolved) {
              resolved = true
              clearTimeout(timeout)
              resolve(result)
            }
          })
          .catch(err => {
            if (!resolved) {
              resolved = true
              clearTimeout(timeout)
              reject(err)
            }
          })
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
