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
  onProgress?: (event: GradioEvent) => void,
  useDirectAPI: boolean = false
): Promise<any> {
  const maxAttempts = API_CONFIG.maxPollAttempts
  let attempts = 0
  const apiBase = useDirectAPI ? API_CONFIG.directBase : getAPIBase()

  while (attempts < maxAttempts) {
    try {
      const url = (API_CONFIG.useProxy && !useDirectAPI)
        ? `${apiBase}/status/${endpoint}/${eventId}`
        : `${apiBase}/call/${endpoint}/${eventId}`

      const response = await fetch(url, {
        method: 'GET',
        headers: (API_CONFIG.useProxy && !useDirectAPI) ? {} : {
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
            const parsed = JSON.parse(data)

            console.log('📥 Raw parsed:', parsed)

            // Handle both event-wrapped and direct data responses
            if (parsed.event) {
              console.log('📥 Event:', parsed.event)

              if (onProgress) {
                onProgress(parsed)
              }

              if (parsed.event === 'complete') {
                console.log('✅ Complete event data:', parsed.data)
                return parsed.data
              } else if (parsed.event === 'error') {
                throw new Error(parsed.data || 'API error occurred')
              } else if (parsed.event === 'generating') {
                if (onProgress) {
                  onProgress({ event: 'generating', data: parsed.data })
                }
              } else if (parsed.event === 'progress') {
                if (onProgress) {
                  onProgress({ event: 'progress', data: parsed.data })
                }
              }
            } else if (Array.isArray(parsed)) {
              // Direct array response (this is what we're getting!)
              console.log('✅ Direct data response:', parsed.length, 'elements')
              if (onProgress) {
                onProgress({ event: 'complete', data: parsed })
              }
              return parsed
            } else {
              console.log('📥 Unknown response format:', parsed)
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

// Generic API call handler with optional direct API bypass
export async function callGradioAPI(
  endpoint: string,
  data: any[] = [],
  onProgress?: (event: GradioEvent) => void,
  useDirectAPI: boolean = false // NEW: bypass proxy for long-running calls
): Promise<any> {
  try {
    const apiBase = useDirectAPI ? API_CONFIG.directBase : getAPIBase()
    const callUrl = `${apiBase}/call/${endpoint}`

    console.log(`🚀 API call: ${endpoint}`, { 
      useProxy: API_CONFIG.useProxy && !useDirectAPI, 
      useDirectAPI,
      data 
    })

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
    const result = await pollForResult(endpoint, eventId, onProgress, useDirectAPI)
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
  // Simple mode generation with full workflow:
  // 1. lambda_12: Generate metadata (prompt, lyrics, BPM, duration, etc.)
  // 2. generationwrapper: Generate actual audio files using metadata
  generateSimple: async (
    description: string,
    instrumental: boolean,
    vocalLanguage: string,
    temperature: number,
    topK: number,
    topP: number,
    thinking: boolean,
    onProgress?: (event: GradioEvent) => void
  ) => {
    // Step 1: Generate metadata with lambda_12
    console.log('🎵 Step 1: Generating metadata with lambda_12...')
    const metadata = await callGradioAPI(
      'lambda_12',
      [description, instrumental, vocalLanguage, temperature, topK, topP, thinking],
      onProgress
    )

    // lambda_12 returns 16 elements:
    // [0] prompt, [1] lyrics, [2] bpm, [3] duration, [4] key, 
    // [5] vocalOut, [6] vocalOpt, [7] timeSig, [8] instrumental, 
    // [9] thinking, [10] status, [11-15] UI updates
    const prompt = metadata[0] || ''
    const lyrics = metadata[1] || ''
    const bpm = metadata[2] || 0
    const duration = metadata[3] || 15
    const key = metadata[4] || ''
    const vocalOut = metadata[5] || 'unknown'
    const timeSig = metadata[7] || '4/4'

    console.log('✅ Metadata generated:', { prompt: prompt.substring(0, 50), lyrics, bpm, duration, key })

    // Step 2: Generate audio with generationwrapper
    console.log('🎵 Step 2: Generating audio with generationwrapper...')
    
    // Use DIRECT API for generationwrapper to avoid Vercel timeout
    const audioResult = await callGradioAPI(
      'generationwrapper',
      [
        'acestep-v1.5-turbo',  // 0: model
        'simple',               // 1: generation mode
        description,            // 2: song description (simple mode)
        vocalLanguage,          // 3: vocal language optional
        prompt,                 // 4: prompt (from lambda_12)
        lyrics,                 // 5: lyrics (from lambda_12)
        bpm,                    // 6: bpm
        key,                    // 7: key signature
        timeSig,                // 8: time signature
        vocalOut,               // 9: vocal language
        8,                      // 10: DiT inference steps
        7,                      // 11: CFG scale
        true,                   // 12: random seed
        '-1',                   // 13: seed value
        null,                   // 14: reference audio
        duration,               // 15: duration
        2,                      // 16: batch size (2 samples)
        null,                   // 17: source audio
        '',                     // 18: audio codes
        0,                      // 19: start time
        -1,                     // 20: end time
        'Fill the audio semantic mask based on the given conditions', // 21: mask condition
        1,                      // 22: strength
        'text2music',           // 23: mode
        false,                  // 24: use custom codes
        0,                      // 25: guidance start
        1,                      // 26: guidance end
        3,                      // 27: shift
        'ode',                  // 28: inference method
        '',                     // 29: custom timesteps
        'mp3',                  // 30: audio format
        temperature,            // 31: LM temperature
        thinking,               // 32: thinking mode
        2,                      // 33: LM CFG scale
        topK,                   // 34: LM top-K
        topP,                   // 35: LM top-P
        'NO USER INPUT',        // 36: LM negative prompt
        true,                   // 37: use LM
        true,                   // 38: use DiT
        true,                   // 39: use vocals
        false,                  // 40: (unknown param)
        thinking,               // 41: extended thinking
        false,                  // 42: get scores
        false,                  // 43: get LRC
        0.5,                    // 44: quality threshold
        8,                      // 45: num samples
        'woodwinds',            // 46: instrument type
        '',                     // 47: custom param
        false,                  // 48: debug mode
      ],
      onProgress,
      true // USE DIRECT API - bypass Vercel proxy timeout
    )

    // generationwrapper returns 38 elements:
    // [0-7]: Audio files (Generated Music Sample 1-8)
    // [8]: All files download
    // [9]: Generation details markdown
    // [10]: Generation status
    // [11]: Seed
    // [12-19]: Quality scores
    // [20-27]: LM codes
    // [28-35]: Lyrics timestamps
    // [36]: Current batch
    // [37]: Next batch status

    console.log('✅ Audio generated! Samples:', audioResult.slice(0, 8).filter(Boolean).length)

    return {
      metadata,      // Original metadata from lambda_12
      audioResult,   // Full audio generation result
      audios: audioResult.slice(0, 8).filter(Boolean), // First 8 = audio files
      prompt,
      lyrics,
      bpm,
      duration,
      key,
      timeSig,
    }
  },

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
