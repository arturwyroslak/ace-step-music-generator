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
  const startTime = Date.now()

  while (attempts < maxAttempts) {
    try {
      const url = (API_CONFIG.useProxy && !useDirectAPI)
        ? `${apiBase}/status/${endpoint}/${eventId}`
        : `${apiBase}/call/${endpoint}/${eventId}`

      const elapsed = Math.round((Date.now() - startTime) / 1000)
      console.log(`🔄 Poll #${attempts + 1}/${maxAttempts} (${elapsed}s elapsed)...`)

      const response = await fetch(url, {
        method: 'GET',
        headers: (API_CONFIG.useProxy && !useDirectAPI) ? {} : {
          'Accept': 'text/event-stream',
        },
      })

      if (!response.ok) {
        console.warn(`⚠️ Poll failed: ${response.statusText}`)
        if (attempts >= maxAttempts - 1) {
          throw new Error(`Polling failed: ${response.statusText}`)
        }
        await new Promise(resolve => setTimeout(resolve, API_CONFIG.pollInterval))
        attempts++
        continue
      }

      const events = await response.text()
      const lines = events.split('\n').filter(line => line.trim())

      console.log(`📥 Received ${lines.length} lines`)

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          try {
            const parsed = JSON.parse(data)

            // Handle both event-wrapped and direct data responses
            if (parsed.event) {
              console.log(`📡 Event: ${parsed.event}`)
              
              if (onProgress) {
                onProgress(parsed)
              }

              if (parsed.event === 'complete') {
                console.log('✅ Complete!')
                return parsed.data
              } else if (parsed.event === 'error') {
                console.error('❌ Error event:', parsed.data)
                throw new Error(parsed.data || 'API error occurred')
              } else if (parsed.event === 'generating' || parsed.event === 'progress') {
                console.log(`🎵 Progress: ${JSON.stringify(parsed.data).substring(0, 100)}...`)
                if (onProgress) {
                  onProgress({ event: parsed.event, data: parsed.data })
                }
              }
            } else if (Array.isArray(parsed)) {
              // Direct array response
              console.log(`✅ Direct array response: ${parsed.length} elements`)
              if (onProgress) {
                onProgress({ event: 'complete', data: parsed })
              }
              return parsed
            } else {
              console.log('🤔 Unknown format:', JSON.stringify(parsed).substring(0, 100))
            }
          } catch (e) {
            // Ignore parse errors for non-JSON lines
            if (data.includes('error') || data.includes('Error') || data.includes('Traceback')) {
              console.error('❌ API Error:', data)
              throw new Error(`API Error: ${data.substring(0, 200)}`)
            }
          }
        }
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, API_CONFIG.pollInterval))
      attempts++
    } catch (error) {
      console.error('❌ Poll error:', error)
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
      apiBase,
      dataLength: data.length 
    })

    // POST request to initiate the call
    const postResponse = await fetch(callUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data }),
    })

    if (!postResponse.ok) {
      const errorText = await postResponse.text()
      console.error('❌ API call failed:', errorText)
      throw new Error(`API call failed: ${postResponse.statusText} - ${errorText.substring(0, 200)}`)
    }

    // Try to parse JSON, but handle text responses too
    const contentType = postResponse.headers.get('content-type')
    let postData: any
    
    if (contentType?.includes('application/json')) {
      postData = await postResponse.json()
    } else {
      const text = await postResponse.text()
      console.error('❌ Non-JSON response:', text.substring(0, 200))
      throw new Error(`API returned non-JSON response: ${text.substring(0, 200)}`)
    }

    const eventId = postData.event_id

    if (!eventId) {
      console.error('❌ No event_id in response:', postData)
      throw new Error('No event_id received from API')
    }

    console.log(`✅ Event ID: ${eventId}`)

    // Poll for results
    const result = await pollForResult(endpoint, eventId, onProgress, useDirectAPI)
    console.log(`✅ API call complete: ${endpoint}`)
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
  // Simple mode generation - generates METADATA only (fast)
  // NOTE: Using direct API to avoid proxy issues
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
    console.log('🎵 Generating music metadata with lambda_12...')
    const metadata = await callGradioAPI(
      'lambda_12',
      [description, instrumental, vocalLanguage, temperature, topK, topP, thinking],
      onProgress,
      true // Use direct API to avoid proxy issues
    )

    // lambda_12 returns 11 elements:
    // [0] prompt, [1] lyrics, [2] bpm, [3] duration, [4] key, 
    // [5] vocalOut, [6] vocalOpt, [7] timeSig, [8] instrumental, 
    // [9] thinking, [10] status
    const prompt = metadata[0] || ''
    const lyrics = metadata[1] || ''
    const bpm = metadata[2] || 0
    const duration = metadata[3] || 15
    const key = metadata[4] || ''
    const vocalOut = metadata[5] || 'unknown'
    const vocalOpt = metadata[6] || 'unknown'
    const timeSig = metadata[7] || '4/4'
    const isInstrumental = metadata[8] || false
    const status = metadata[10] || '✅ Metadata generated'

    console.log('✅ Metadata generated:', { 
      prompt: prompt.substring(0, 50) + '...', 
      lyrics: lyrics ? lyrics.substring(0, 100) + '...' : '[Instrumental]', 
      bpm, 
      duration, 
      key,
      timeSig 
    })

    return {
      metadata,
      prompt,
      lyrics,
      bpm,
      duration,
      key,
      timeSig,
      instrumental: isInstrumental,
      vocalLanguage: vocalOut,
      status,
    }
  },

  // Generate actual audio files from metadata (lambda_13)
  // This is the MAIN generation endpoint that produces audio files
  generateAudio: async (
    prompt: string,
    lyrics: string,
    bpm: number,
    keySignature: string,
    vocalLanguage: string,
    timeSignature: string,
    duration: number,
    batchSize: number,
    thinking: boolean,
    audioDuration: number,
    srcAudio: any,
    startTime: number,
    numSegments: number,
    refAudio: any,
    contextPrompt: string,
    contextStart: number,
    contextDuration: number,
    maskPrompt: string,
    maskStart: number,
    mode: string,
    useHybridCFG: boolean,
    cfgScale: number,
    ditSteps: number,
    inferenceMethod: string,
    customTimesteps: string,
    audioFormat: string,
    temperature: number,
    thinking2: boolean,
    lmCfgScale: number,
    topK: number,
    topP: number,
    negativePrompt: string,
    useAudioLoRA: boolean,
    useTextLoRA: boolean,
    useAudioLM: boolean,
    thinking3: boolean,
    genScores: boolean,
    genLyrics: boolean,
    genNextBatch: boolean,
    qualityScore: number,
    randomSegments: number,
    maskInstrument: string,
    maskInstruments: any,
    onProgress?: (event: GradioEvent) => void
  ) => {
    console.log('🎼 Generating audio with lambda_13...')
    console.log(`⏱️ Expected duration: ~${Math.round(duration * 0.15)} minutes for ${duration}s of audio`)
    
    const result = await callGradioAPI(
      'lambda_13',
      [
        prompt,
        lyrics,
        bpm,
        keySignature,
        vocalLanguage,
        timeSignature,
        duration,
        batchSize,
        thinking,
        audioDuration,
        srcAudio,
        startTime,
        numSegments,
        refAudio,
        contextPrompt,
        contextStart,
        contextDuration,
        maskPrompt,
        maskStart,
        mode,
        useHybridCFG,
        cfgScale,
        ditSteps,
        inferenceMethod,
        customTimesteps,
        audioFormat,
        temperature,
        thinking2,
        lmCfgScale,
        topK,
        topP,
        negativePrompt,
        useAudioLoRA,
        useTextLoRA,
        useAudioLM,
        thinking3,
        genScores,
        genLyrics,
        genNextBatch,
        qualityScore,
        randomSegments,
        maskInstrument,
        maskInstruments,
      ],
      onProgress,
      true // Use direct API for long audio generation
    )

    console.log('✅ Audio generation complete:', result)
    return result
  },

  // Simplified audio generation wrapper with sensible defaults
  generateAudioSimple: async (
    prompt: string,
    lyrics: string,
    bpm: number,
    keySignature: string,
    vocalLanguage: string,
    timeSignature: string,
    duration: number,
    onProgress?: (event: GradioEvent) => void
  ) => {
    return generationAPI.generateAudio(
      prompt,
      lyrics,
      bpm,
      keySignature,
      vocalLanguage,
      timeSignature,
      duration,
      2, // batchSize (generate 2 variations)
      false, // thinking
      duration, // audioDuration (same as duration)
      null, // srcAudio
      0, // startTime
      1, // numSegments
      null, // refAudio
      '', // contextPrompt
      0, // contextStart
      10, // contextDuration
      '', // maskPrompt
      0, // maskStart
      'text2music', // mode
      true, // useHybridCFG
      3.0, // cfgScale
      8, // ditSteps (turbo default)
      'single_step', // inferenceMethod
      '', // customTimesteps
      'flac', // audioFormat
      0.85, // temperature
      false, // thinking2
      1.5, // lmCfgScale
      0, // topK
      0.9, // topP
      '', // negativePrompt
      false, // useAudioLoRA
      false, // useTextLoRA
      true, // useAudioLM
      false, // thinking3
      false, // genScores
      true, // genLyrics
      false, // genNextBatch
      0, // qualityScore
      0, // randomSegments
      '', // maskInstrument
      [], // maskInstruments
      onProgress
    )
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
