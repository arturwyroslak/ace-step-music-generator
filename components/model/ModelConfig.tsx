'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { useModelStore } from '@/lib/store/model'
import { modelAPI } from '@/lib/api/client'
import { Settings, Loader2, CheckCircle2, XCircle, Upload } from 'lucide-react'

export function ModelConfig() {
  const store = useModelStore()

  const handleInitialize = async () => {
    store.setIsInitializing(true)
    store.setModelStatus('Initializing model...')

    try {
      const result = await modelAPI.initialize({
        checkpointFile: store.checkpointFile,
        configPath: store.configPath,
        device: store.device,
        init5HzLM: store.init5HzLM,
        lmModelPath: store.lmModelPath,
        lmBackend: store.lmBackend,
        useFlashAttention: store.useFlashAttention,
        offloadCPU: store.offloadCPU,
        offloadDiTCPU: store.offloadDiTCPU,
      })

      if (result && Array.isArray(result) && result[0]) {
        store.setModelStatus(result[0])
        store.setIsInitialized(true)
      } else {
        store.setModelStatus('Model initialized successfully')
        store.setIsInitialized(true)
      }
    } catch (error) {
      console.error('Initialization failed:', error)
      store.setModelStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      store.setIsInitialized(false)
    } finally {
      store.setIsInitializing(false)
    }
  }

  const handleLoadLoRA = async () => {
    if (!store.loraPath.trim()) {
      alert('Please enter a LoRA path')
      return
    }

    try {
      store.setLoraStatus('Loading LoRA...')
      const result = await modelAPI.loadLoRA(store.loraPath)

      if (result) {
        store.setLoraStatus(typeof result === 'string' ? result : 'LoRA loaded successfully')
        store.setLoraLoaded(true)
      }
    } catch (error) {
      console.error('LoRA loading failed:', error)
      store.setLoraStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      store.setLoraLoaded(false)
    }
  }

  const handleUnloadLoRA = async () => {
    try {
      store.setLoraStatus('Unloading LoRA...')
      const result = await modelAPI.unloadLoRA()

      if (result) {
        store.setLoraStatus(typeof result === 'string' ? result : 'LoRA unloaded')
        store.setLoraLoaded(false)
        store.setUseLoRA(false)
      }
    } catch (error) {
      console.error('LoRA unloading failed:', error)
      store.setLoraStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Model Configuration
          </CardTitle>
          <CardDescription>
            Initialize and configure the ACE-STEP model
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="configPath">Model Configuration</Label>
              <Select value={store.configPath} onValueChange={store.setConfigPath}>
                <SelectTrigger id="configPath">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="acestep-v15-turbo">ACE-STEP v1.5 Turbo</SelectItem>
                  <SelectItem value="acestep-v15">ACE-STEP v1.5</SelectItem>
                  <SelectItem value="acestep-v14">ACE-STEP v1.4</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="checkpointFile">Checkpoint Path</Label>
              <Input
                id="checkpointFile"
                value={store.checkpointFile}
                onChange={(e) => store.setCheckpointFile(e.target.value)}
                placeholder="/data/checkpoints"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="device">Device</Label>
              <Select value={store.device} onValueChange={store.setDevice}>
                <SelectTrigger id="device">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto</SelectItem>
                  <SelectItem value="cuda">CUDA (GPU)</SelectItem>
                  <SelectItem value="cpu">CPU</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="init5HzLM"
                  checked={store.init5HzLM}
                  onCheckedChange={(checked) => store.setInit5HzLM(checked as boolean)}
                />
                <Label htmlFor="init5HzLM">Initialize 5Hz Language Model</Label>
              </div>

              {store.init5HzLM && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="lmModelPath">LM Model Path</Label>
                    <Input
                      id="lmModelPath"
                      value={store.lmModelPath}
                      onChange={(e) => store.setLmModelPath(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lmBackend">LM Backend</Label>
                    <Select value={store.lmBackend} onValueChange={store.setLmBackend}>
                      <SelectTrigger id="lmBackend">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vllm">vLLM</SelectItem>
                        <SelectItem value="transformers">Transformers</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="useFlashAttention"
                  checked={store.useFlashAttention}
                  onCheckedChange={(checked) => store.setUseFlashAttention(checked as boolean)}
                />
                <Label htmlFor="useFlashAttention">Use Flash Attention</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="offloadCPU"
                  checked={store.offloadCPU}
                  onCheckedChange={(checked) => store.setOffloadCPU(checked as boolean)}
                />
                <Label htmlFor="offloadCPU">Offload LM to CPU</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="offloadDiTCPU"
                  checked={store.offloadDiTCPU}
                  onCheckedChange={(checked) => store.setOffloadDiTCPU(checked as boolean)}
                />
                <Label htmlFor="offloadDiTCPU">Offload DiT to CPU</Label>
              </div>
            </div>
          </div>

          <Button
            onClick={handleInitialize}
            disabled={store.isInitializing}
            className="w-full gap-2"
            size="lg"
          >
            {store.isInitializing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Initializing...
              </>
            ) : store.isInitialized ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Reinitialize Model
              </>
            ) : (
              <>
                <Settings className="h-4 w-4" />
                Initialize Model
              </>
            )}
          </Button>

          {store.modelStatus && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium flex items-center gap-2">
                {store.isInitialized ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                {store.modelStatus}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            LoRA Configuration
          </CardTitle>
          <CardDescription>
            Load custom LoRA adapters for style transfer
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="loraPath">LoRA Path</Label>
            <Input
              id="loraPath"
              value={store.loraPath}
              onChange={(e) => store.setLoraPath(e.target.value)}
              placeholder="path/to/lora/adapter"
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleLoadLoRA}
              disabled={!store.loraPath.trim() || !store.isInitialized}
              className="flex-1"
            >
              Load LoRA
            </Button>
            <Button
              onClick={handleUnloadLoRA}
              disabled={!store.loraLoaded || !store.isInitialized}
              variant="outline"
              className="flex-1"
            >
              Unload LoRA
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="useLoRA"
              checked={store.useLoRA}
              onCheckedChange={(checked) => {
                store.setUseLoRA(checked as boolean)
                if (store.isInitialized) {
                  modelAPI.setUseLoRA(checked as boolean)
                }
              }}
              disabled={!store.loraLoaded}
            />
            <Label htmlFor="useLoRA">Use LoRA for generation</Label>
          </div>

          {store.loraStatus && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium">{store.loraStatus}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
