'use client'

import { useState, useCallback, useRef } from 'react'
import { generationAPI, type GradioEvent } from '@/lib/api/client'
import type { MusicGenerationParams, GenerationResult } from '@/lib/types'

export function useMusicGeneration() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState<string>('')
  const [result, setResult] = useState<GenerationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const pollCountRef = useRef(0)
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null)

  const generate = useCallback(async (params: MusicGenerationParams) => {
    setIsGenerating(true)
    setError(null)
    setProgress('Starting generation...')
    pollCountRef.current = 0

    try {
      // STEP 1: Generate metadata with lambda_12
      console.log('🚀 Step 1: Generating metadata...')
      setProgress('🎵 Generating song metadata...')
      
      const metadataResult = await generationAPI.generateSimple(
        params.description,
        params.instrumental || false,
        params.vocalLanguage || 'unknown',
        params.temperature || 0.85,
        params.topK || 0,
        params.topP || 0.9,
        false, // thinking
        (event: GradioEvent) => {
          console.log('📡 Metadata event:', event)
          if (event.event === 'generating' || event.event === 'progress') {
            setProgress(`🎵 Generating metadata... ${event.data || ''}`)
          }
        }
      )

      console.log('✅ Metadata generated:', metadataResult)

      // Fix time signature format - ensure it's always X/Y
      let timeSignature = metadataResult.timeSig
      if (timeSignature && !timeSignature.includes('/')) {
        // If it's just a number like "4", convert to "4/4"
        timeSignature = `${timeSignature}/4`
      }

      console.log('🎵 Time signature fixed:', metadataResult.timeSig, '→', timeSignature)

      // STEP 2: Generate audio with generation_wrapper using ALL parameters
      console.log('🚀 Step 2: Generating audio with full API...')
      const estimatedMinutes = Math.round(metadataResult.duration * 0.15)
      setProgress(`🎼 Generating audio... (estimated ${estimatedMinutes} min)`)

      // Start a timer to update progress every 5 seconds
      pollCountRef.current = 0
      pollTimerRef.current = setInterval(() => {
        pollCountRef.current += 1
        const elapsed = Math.round(pollCountRef.current * 5 / 60 * 10) / 10 // minutes with 1 decimal
        setProgress(`🎼 Generating ${metadataResult.duration}s audio... ${elapsed}/${estimatedMinutes} min elapsed`)
      }, 5000)

      const audioResult = await generationAPI.generateAudioFull(
        metadataResult.prompt,
        metadataResult.lyrics,
        metadataResult.bpm,
        metadataResult.key,
        metadataResult.vocalLanguage,
        timeSignature, // Use fixed time signature
        metadataResult.duration,
        (event: GradioEvent) => {
          console.log('📡 Audio event:', event)
          if (event.event === 'generating') {
            setProgress(`🎼 Generating audio... ${event.data || ''}`)
          } else if (event.event === 'progress') {
            setProgress(`🎼 Progress: ${JSON.stringify(event.data)}`)
          }
        }
      )

      // Clear the timer
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current)
        pollTimerRef.current = null
      }

      console.log('✅ Audio generated:', audioResult)

      // generation_wrapper returns 38 elements:
      // 0-7: Audio files (8 samples)
      // 8: Download file
      // 9: Generation details markdown
      // 10: Status text
      const audioFiles = audioResult.slice(0, 8).filter((item: any) => item?.url)

      const finalResult: GenerationResult = {
        audioUrl: audioFiles[0]?.url || null,
        audioUrls: audioFiles.map((item: any) => item.url),
        metadata: {
          prompt: metadataResult.prompt,
          lyrics: metadataResult.lyrics,
          bpm: metadataResult.bpm,
          duration: metadataResult.duration,
          keySignature: metadataResult.key,
          timeSignature,
          vocalLanguage: metadataResult.vocalLanguage,
          instrumental: metadataResult.instrumental,
        },
      }

      setResult(finalResult)
      setProgress('✅ Generation complete!')
      return finalResult
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error('❌ Generation failed:', err)
      setError(errorMessage)
      setProgress('')
      throw err
    } finally {
      setIsGenerating(false)
      // Clean up timer
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current)
        pollTimerRef.current = null
      }
    }
  }, [])

  const reset = useCallback(() => {
    setResult(null)
    setError(null)
    setProgress('')
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current)
      pollTimerRef.current = null
    }
  }, [])

  return {
    generate,
    reset,
    isGenerating,
    progress,
    result,
    error,
  }
}
