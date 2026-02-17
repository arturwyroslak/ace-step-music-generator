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

      console.log(`📊 Response status: ${response.status} ${response.statusText}`)

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
      console.log(`📥 Received ${events.length} bytes, ${events.split('\n').length} lines`)
      console.log(`📝 Raw response preview:`, events.substring(0, 500))
      
      const lines = events.split('\n').filter(line => line.trim())

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          console.log(`📦 Data line:`, data.substring(0, 200))
          
          // Handle null data
          if (data === 'null' || data.trim() === '') {
            console.warn('⚠️ Received null or empty data, skipping...')
            continue
          }
          
          try {
            const parsed = JSON.parse(data)

            // Handle both event-wrapped and direct data responses
            if (parsed && typeof parsed === 'object' && 'event' in parsed) {
              console.log(`📡 Event: ${parsed.event}`, parsed.data)
              
              if (onProgress) {
                onProgress(parsed)
              }

              if (parsed.event === 'complete') {
                console.log('✅ Complete!')
                return parsed.data
              } else if (parsed.event === 'error') {
                const errorMsg = parsed.data || 'API error occurred (no details provided)'
                console.error('❌ Error event:', errorMsg)
                throw new Error(String(errorMsg))
              } else if (parsed.event === 'generating' || parsed.event === 'progress') {
                console.log(`🎵 Progress: ${JSON.stringify(parsed.data).substring(0, 100)}...`)
                if (onProgress) {
                  onProgress({ event: parsed.event, data: parsed.data })
                }
              } else if (parsed.event === 'heartbeat') {
                console.log('💓 Heartbeat received')
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
            console.warn('⚠️ Parse error:', e, 'Data:', data.substring(0, 100))
            // Ignore parse errors for non-JSON lines
            if (data.includes('error') || data.includes('Error') || data.includes('Traceback')) {
              console.error('❌ API Error:', data)
              throw new Error(`API Error: ${data.substring(0, 200)}`)
            }
          }
        } else if (line.startsWith('event: error')) {
          console.error('❌ Error event detected in line:', line)
          throw new Error('API returned an error event without details')
        }
      }

      // Wait before next poll
      console.log(`⏳ Waiting ${API_CONFIG.pollInterval}ms before next poll...`)
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
  useDirectAPI: boolean = false
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
      true
    )

    const prompt = metadata[0] || ''
    const lyrics = metadata[1] || ''
    const bpm = metadata[2] || 120
    const duration = Math.min(metadata[3] || 15, 30)
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
      duration: `${duration}s (capped from ${metadata[3]}s)`,
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

  // FULL GENERATION using generation_wrapper with ALL 49 parameters
  generateAudioFull: async (
    prompt: string,
    lyrics: string,
    bpm: number,
    keySignature: string,
    vocalLanguage: string,
    timeSignature: string,
    duration: number,
    onProgress?: (event: GradioEvent) => void
  ) => {
    console.log('🎼 Generating audio with generation_wrapper...')
    console.log('⏱️ Expected duration: ~5 minutes for 30s of audio')
    console.log('📋 Parameters:', { 
      prompt: prompt.substring(0, 50), 
      bpm, 
      keySignature, 
      vocalLanguage,
      timeSignature,
      duration 
    })

    // Build ALL 49 parameters for generation_wrapper according to docs
    const params = [
      'acestep-v1.5-turbo',     // 0: models (default model)
      'simple',                  // 1: mode (simple/custom/cover/repaint)
      prompt,                    // 2: description (song description for simple mode)
      vocalLanguage,            // 3: vocal language optional
      prompt,                    // 4: prompt text
      lyrics,                    // 5: lyrics
      bpm,                       // 6: BPM
      keySignature,             // 7: key signature
      timeSignature,            // 8: time signature
      vocalLanguage,            // 9: vocal language
      8,                         // 10: DiT inference steps
      7,                         // 11: CFG scale
      true,                      // 12: random seed
      '-1',                      // 13: seed (string)
      null,                      // 14: reference audio
      duration,                  // 15: audio duration
      1,                         // 16: batch size
      null,                      // 17: source audio
      '',                        // 18: audio codes
      0,                         // 19: start seconds
      -1,                        // 20: end seconds
      '',                        // 21: repaint prompt
      1,                         // 22: strength slider
      'text2music',              // 23: mode dropdown
      false,                     // 24: checkbox 157
      0,                         // 25: slider 158
      1,                         // 26: slider 159
      3,                         // 27: shift
      'ode',                     // 28: inference method
      '',                        // 29: custom timesteps
      'mp3',                     // 30: audio format
      0.85,                      // 31: LM temperature
      false,                     // 32: thinking
      2,                         // 33: LM CFG scale
      0,                         // 34: LM top-K
      0.9,                       // 35: LM top-P
      'NO USER INPUT',          // 36: LM negative prompt
      true,                      // 37: checkbox 160
      true,                      // 38: checkbox 161
      true,                      // 39: checkbox 162
      false,                     // 40: (missing in docs but needed)
      false,                     // 41: checkbox 163
      false,                     // 42: checkbox 164
      false,                     // 43: get scores
      false,                     // 44: get LRC
      0.5,                       // 45: quality slider
      8,                         // 46: number 165
      'woodwinds',               // 47: dropdown 154
      [],                        // 48: checkboxgroup 155
      false,                     // 49: checkbox 167 (auto-gen batches)
    ]

    console.log('🚀 Calling generation_wrapper with 49 parameters...')

    const audioResult = await callGradioAPI(
      'generation_wrapper',
      params,
      onProgress,
      true // use direct API
    )

    console.log('✅ Audio generated, result elements:', audioResult.length)

    // generation_wrapper returns 38 elements:
    // 0-7: Audio files
    // 8: Download file
    // 9: Generation details (markdown)
    // 10: Generation status
    // etc.

    return audioResult
  },
}
