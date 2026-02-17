'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ModelConfig } from '@/components/model/ModelConfig'
import { GenerationPanel } from '@/components/generation/GenerationPanel'
import { DatasetManager } from '@/components/dataset/DatasetManager'
import { TrainingPanel } from '@/components/training/TrainingPanel'
import { Music, Settings, Database, GraduationCap } from 'lucide-react'

export default function Home() {
  const [activeTab, setActiveTab] = useState('generate')

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            ACE-STEP Music Generator
          </h1>
          <p className="text-muted-foreground">
            AI-powered music generation with advanced controls
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto">
            <TabsTrigger value="generate" className="gap-2">
              <Music className="h-4 w-4" />
              Generate
            </TabsTrigger>
            <TabsTrigger value="model" className="gap-2">
              <Settings className="h-4 w-4" />
              Model
            </TabsTrigger>
            <TabsTrigger value="dataset" className="gap-2">
              <Database className="h-4 w-4" />
              Dataset
            </TabsTrigger>
            <TabsTrigger value="training" className="gap-2">
              <GraduationCap className="h-4 w-4" />
              Training
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-6">
            <GenerationPanel />
          </TabsContent>

          <TabsContent value="model" className="space-y-6">
            <ModelConfig />
          </TabsContent>

          <TabsContent value="dataset" className="space-y-6">
            <DatasetManager />
          </TabsContent>

          <TabsContent value="training" className="space-y-6">
            <TrainingPanel />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
