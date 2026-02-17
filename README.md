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
- **Real-time Progress**: Live status updates and event streaming
- **Audio Export**: Download generations with metadata

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: Zustand
- **API**: Gradio streaming events

## Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
npm start
```

## Configuration

API endpoint is configured in `lib/api/client.ts`:

```typescript
const API_BASE = 'https://ace-step-ace-step-v1-5.hf.space/gradio_api'
```

## Usage

1. **Initialize Model**: Configure and load the ACE-STEP model
2. **Choose Generation Mode**: Select Simple, Custom, Cover, or Repaint
3. **Set Parameters**: Adjust inference steps, CFG, temperature, etc.
4. **Generate**: Click generate and wait for streaming results
5. **Export**: Download audio files with metadata

## Project Structure

```
├── app/                    # Next.js app router
│   ├── page.tsx           # Main application
│   └── layout.tsx         # Root layout
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── generation/        # Music generation UI
│   ├── model/             # Model configuration UI
│   ├── dataset/           # Dataset management UI
│   └── training/          # LoRA training UI
├── lib/
│   ├── api/               # API client and types
│   ├── store/             # Zustand state management
│   └── utils.ts           # Utilities
└── types/                 # TypeScript definitions
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

## Development

Built with enterprise-grade architecture:

- Type-safe API client with full endpoint coverage
- Modular component design for maintainability
- Real-time event streaming with proper error handling
- Responsive UI with dark mode support
- Optimized performance with React Server Components

## License

MIT

## Credits

Interface for [ACE-STEP](https://huggingface.co/spaces/ace-step/ace-step-v1-5) AI Music Generation model.
