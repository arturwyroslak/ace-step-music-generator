# ACE-STEP Music Generator 🎵

Complete production-ready web interface for the ACE-STEP AI Music Generation API with all 99 endpoints.

## Features

### 🎼 Music Generation Modes
- **Simple Mode**: Quick music generation with description
- **Custom Mode**: Full control over prompts, lyrics, BPM, key, time signature
- **Cover Mode**: Transform existing audio with style transfer
- **Repaint Mode**: Edit specific sections of audio

### 🎛️ Advanced Controls
- **Model Management**: Initialize and configure DiT models
- **LoRA Support**: Load/unload LoRA adapters for style customization
- **Batch Generation**: Generate up to 8 samples simultaneously
- **Audio Analysis**: Transcribe codes, extract metadata
- **Quality Scoring**: Evaluate generation quality

### 🔧 Technical Features
- **Dataset Tools**: Import, label, and preprocess training data
- **LoRA Training**: Fine-tune models with custom datasets
- **Real-time Progress**: Live status updates with polling
- **Audio Export**: Download generations with metadata
- **Dual API Mode**: Proxy or direct connection

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: Zustand
- **API**: Gradio with polling fallback

## Installation

```bash
# Clone repository
git clone https://github.com/arturwyroslak/ace-step-music-generator.git
cd ace-step-music-generator

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
npm start
```

## Configuration

### API Mode

The app supports two connection modes:

1. **Proxy Mode (Default)**: Routes API calls through Next.js API routes
   - ✅ Avoids CORS issues
   - ✅ Better error handling
   - ⚠️ Requires server deployment

2. **Direct Mode**: Direct browser-to-API calls
   - ✅ Works without server
   - ⚠️ May encounter CORS issues
   - ⚠️ EventSource not supported

Switch modes in `lib/api/config.ts`:

```typescript
export const API_CONFIG = {
  useProxy: true, // Set to false for direct mode
  // ...
}
```

Or use the UI toggle in the app interface.

## Usage

### Quick Start

1. **Choose API Mode**: Select Proxy or Direct mode based on your setup
2. **Initialize Model**: Go to Model tab and initialize ACE-STEP
3. **Generate Music**: 
   - Simple Mode: Enter description and generate
   - Custom Mode: Set detailed parameters
4. **Download**: Save generated audio files

### Advanced Workflows

#### LoRA Training

1. Prepare dataset of audio files
2. Use Dataset tab to preprocess
3. Configure training parameters
4. Start training and monitor progress
5. Load trained LoRA in Model tab

#### Custom Generation

1. Set prompt, lyrics, BPM, key
2. Adjust temperature, CFG scale
3. Enable/disable 5Hz LM
4. Generate with thinking mode

## Project Structure

```
ace-step-music-generator/
├── app/
│   ├── api/gradio/          # API proxy routes
│   ├── page.tsx             # Main app
│   └── layout.tsx           # Root layout
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── generation/          # GenerationPanel
│   ├── model/               # ModelConfig
│   ├── dataset/             # DatasetManager
│   ├── training/            # TrainingPanel
│   └── ApiModeToggle.tsx    # Connection mode toggle
├── lib/
│   ├── api/
│   │   ├── client.ts        # API client
│   │   └── config.ts        # API configuration
│   ├── store/               # Zustand stores
│   └── utils.ts             # Utilities
└── types/                   # TypeScript definitions
```

## API Endpoints Coverage

✅ **Model Management** (6 endpoints)
- Model initialization and configuration
- LoRA adapter loading/unloading
- Device and backend selection

✅ **Music Generation** (15+ endpoints)
- Text-to-music, audio cover, audio repaint
- Simple and custom mode generation
- Batch processing support

✅ **Audio Processing** (10+ endpoints)
- Audio code transcription
- Metadata extraction
- Quality scoring

✅ **Dataset Management** (20+ endpoints)
- Audio file scanning and labeling
- Dataset preprocessing
- Tensor conversion

✅ **Training** (5+ endpoints)
- LoRA training with custom datasets
- Training monitoring and logs
- Checkpoint management

✅ **UI Helpers** (40+ endpoints)
- Dynamic UI updates
- State synchronization
- Example loading

## Troubleshooting

### CORS Errors

**Solution 1**: Use Proxy Mode (recommended)
```typescript
API_CONFIG.useProxy = true
```

**Solution 2**: Deploy to server with API routes
```bash
npm run build
npm start
```

**Solution 3**: Use Direct Mode with CORS extension (development only)

### Connection Timeout

Increase timeout in `lib/api/config.ts`:
```typescript
maxPollAttempts: 1200 // 10 minutes
```

### API Not Responding

Check:
1. Gradio Space is running: https://ace-step-ace-step-v1-5.hf.space/
2. Network connection
3. Browser console for errors

## Development

Built with enterprise-grade architecture:

- ✅ Type-safe API client with full endpoint coverage
- ✅ Modular component design for maintainability
- ✅ Polling-based requests with proper error handling
- ✅ Responsive UI with dark mode support
- ✅ Optimized performance with React Server Components
- ✅ Dual connection mode for flexibility

## Deployment

### Vercel (Recommended)

```bash
vercel deploy
```

### Docker

```bash
docker build -t ace-step-generator .
docker run -p 3000:3000 ace-step-generator
```

### Self-hosted

```bash
npm run build
npm start
```

## License

MIT

## Credits

Interface for [ACE-STEP](https://huggingface.co/spaces/ace-step/ace-step-v1-5) AI Music Generation model.

## Support

For issues and questions:
- GitHub Issues: https://github.com/arturwyroslak/ace-step-music-generator/issues
- Hugging Face Space: https://huggingface.co/spaces/ace-step/ace-step-v1-5
