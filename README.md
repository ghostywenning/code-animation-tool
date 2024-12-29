# Code Animation Recorder

A simple and convenient tool for creating animated code demonstrations. Record your coding process with customizable typing speed and save it as a video.

## Features

- 🎥 Record code typing animations
- ⚡ Adjustable typing speed
- 🎨 Syntax highlighting for various languages
- 📝 Multiple tabs support
- 📱 Responsive design

## Demo

Try it now: [code-animation-tool.otf.icu](https://code-animation-tool.otf.icu)

## Project Structure

```
src/
├── components/
│   ├── CodeEditor.vue      # Main editor component with Monaco
│   ├── CodeEditorTabs.vue  # Tabs management component
│   └── ExportSettings.vue  # Recording settings and controls
├── views/
│   └── index.vue          # Main application view
├── types/
│   ├── vite-env.d.ts      # Vite environment types
│   └── shims-vue.d.ts     # Vue components type declarations
└── services/
    └── Monaco/            # Monaco editor configuration
```

## Installation

```bash
# Install dependencies
yarn install

# Run development server
yarn dev

# Build for production
yarn build
```

## Usage

1. Open the app in your browser
2. Enter or paste your code into the editor
3. Adjust the typing speed
4. Click "Play and Start Recording"
5. The recording will automatically save when the animation completes

## Tech Stack

- Vue 3
- TypeScript
- Monaco Editor
- Element Plus

## License

MIT
