// ACE-STEP API Client with dual mode support
import { API_CONFIG, getAPIBase } from './config'

export interface GradioEventData {
  data: any[]
}

export interface GradioEvent {
  event: string
  data?: any
}

// Polling-based API call
async function pollForResult(
  endpoint: string,
  eventId: string,
  onProgress?: (event: GradioEvent) => void
): Promise<any> {
  const maxAttempts = API_CONFIG.maxPollAttempts
  let attempts = 0
  const apiBase = getAPIBase()

  while (attempts < maxAttempts) {
    try {
      const url = API_CONFIG.useProxy
        ? `${apiBase}/status/${endpoint}/${eventId}`
        : `${apiBase}/call/${endpoint}/${eventId}`

      const response = await fetch(url, {
        method: 'GET',
        headers: API_CONFIG.useProxy ? {} : {
          'Accept': 'text/event-stream',
        },
      })

      if (!response.ok) {
        if (attempts >= maxAttempts - 1) {
          throw new Error(`Polling failed: ${response.statusText}`)
        }
        await new Promise(resolve => setTimeout(resolve, API_CONFIG.pollInterval))
        attempts++
        continue
      }

      const events = await response.text()
      const lines = events.split('\n').filter(line => line.trim())

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          try {
            const parsed = JSON.parse(data) as GradioEvent

            console.log('📥 Event:', parsed.event, parsed)

            if (onProgress) {
              onProgress(parsed)
            }

            if (parsed.event === 'complete') {
              console.log('✅ Complete event data:', parsed.data)
              return parsed.data
            } else if (parsed.event === 'error') {
              throw new Error(parsed.data || 'API error occurred')
            } else if (parsed.event === 'generating') {
              // Update progress
              if (onProgress) {
                onProgress({ event: 'generating', data: parsed.data })
              }
            } else if (parsed.event === 'progress') {
              // Progress update
              if (onProgress) {
                onProgress({ event: 'progress', data: parsed.data })
              }
            }
          } catch (e) {
            // Ignore parse errors for non-JSON lines
            if (data.includes('error') || data.includes('Error')) {
              console.error('Parse error:', data)
              throw new Error(data)
            }
          }
        }
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, API_CONFIG.pollInterval))
      attempts++
    } catch (error) {
      console.error('Poll error:', error)
      if (attempts >= maxAttempts - 1) {
        throw error
      }
      await new Promise(resolve => setTimeout(resolve, API_CONFIG.pollInterval))
      attempts++
    }
  }

  throw new Error('Request timeout: No response from API after ' + (API_CONFIG.maxPollAttempts * API_CONFIG.pollInterval / 1000) + ' seconds')
}

// Generic API call handler
export async function callGradioAPI(
  endpoint: string,
  data: any[] = [],
  onProgress?: (event: GradioEvent) => void
): Promise<any> {
  try {
    const apiBase = getAPIBase()
    const callUrl = API_CONFIG.useProxy
      ? `${apiBase}/call/${endpoint}`
      : `${apiBase}/call/${endpoint}`

    console.log(`🚀 API call: ${endpoint}`, { useProxy: API_CONFIG.useProxy, data })

    // POST request to initiate the call
    const postResponse = await fetch(callUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data }),
    })

    if (!postResponse.ok) {
      const errorText = await postResponse.text()
      throw new Error(`API call failed: ${postResponse.statusText} - ${errorText}`)
    }

    const postData = await postResponse.json()
    const eventId = postData.event_id

    if (!eventId) {
      throw new Error('No event_id received from API')
    }

    console.log(`✅ Event ID: ${eventId}`)

    // Poll for results
    const result = await pollForResult(endpoint, eventId, onProgress)
    console.log(`✅ API call complete: ${endpoint}`, result)
    return result
  } catch (error) {
    console.error(`❌ API call failed: ${endpoint}`, error)
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
  // Returns 11 elements according to API docs:
  // 0: Prompt
  // 1: Lyrics
  // 2: BPM
  // 3: Duration
  // 4: Key Signature
  // 5: Vocal Language (output)
  // 6: Vocal Language (optional)
  // 7: Time Signature
  // 8: Instrumental checkbox
  // 9: Thinking checkbox
  // 10: Generation Status
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
  // Returns 8 elements:
  // 0: Prompt, 1: Lyrics, 2: BPM, 3: Duration, 4: Key, 5: Vocal Lang, 6: Time Sig, 7: Status
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
  // Returns 3 elements: [description, instrumental, vocalLanguage]
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
