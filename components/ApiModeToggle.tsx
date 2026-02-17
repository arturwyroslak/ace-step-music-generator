'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { API_CONFIG } from '@/lib/api/config'
import { Globe, Server } from 'lucide-react'

export function ApiModeToggle() {
  const [mode, setMode] = useState<'proxy' | 'direct'>('proxy')

  useEffect(() => {
    setMode(API_CONFIG.useProxy ? 'proxy' : 'direct')
  }, [])

  const handleModeChange = (value: string) => {
    const newMode = value as 'proxy' | 'direct'
    setMode(newMode)
    API_CONFIG.useProxy = newMode === 'proxy'
    
    // Reload to apply changes
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  return (
    <Card className="border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Server className="h-4 w-4" />
          API Connection Mode
        </CardTitle>
        <CardDescription className="text-xs">
          If you encounter CORS errors, try switching modes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup value={mode} onValueChange={handleModeChange}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="proxy" id="proxy" />
            <Label htmlFor="proxy" className="flex items-center gap-2 cursor-pointer">
              <Server className="h-4 w-4" />
              <div>
                <div className="font-medium">Proxy Mode (Recommended)</div>
                <div className="text-xs text-muted-foreground">Routes through Next.js API</div>
              </div>
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="direct" id="direct" />
            <Label htmlFor="direct" className="flex items-center gap-2 cursor-pointer">
              <Globe className="h-4 w-4" />
              <div>
                <div className="font-medium">Direct Mode</div>
                <div className="text-xs text-muted-foreground">Direct API calls (may have CORS issues)</div>
              </div>
            </Label>
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  )
}
