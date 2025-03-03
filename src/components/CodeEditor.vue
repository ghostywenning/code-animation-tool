<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import * as monaco from 'monaco-editor'

// Настраиваем Web Workers

const code = defineModel<string>('modelValue')
const filename = defineModel<string>('filename', { default: '' })
const props = defineProps<{
  speed: number
  isRecording?: boolean
  ratio?: '16:9' | '9:16' | '3:4' | 'custom'
  recordingWidth?: number
  recordingHeight?: number
  isPreview?: boolean
  fontSize?: number
  hideLineNumbers?: boolean
  title?: string
  showBorder?: boolean
  borderColor?: string
  borderRadius?: number
}>()
const editorContainer = ref<HTMLElement>()
let editor: monaco.editor.IStandaloneCodeEditor | null = null
const isPlaying = ref(false)
const shouldStop = ref(false)
const recordingArea = ref<HTMLElement>()

// Добавим emit для событий печати
const emit = defineEmits<{
  'typing-start': [],
  'typing-complete': []
}>()

onMounted(() => {
  if (!editorContainer.value) return

  editor = monaco.editor.create(editorContainer.value, {
    value: code.value,
    language: language.value,
    theme: 'custom-dark',
    minimap: { enabled: false },
    fontSize: props.fontSize || 14,
    lineNumbers: props.hideLineNumbers ? 'off' : 'on',
    automaticLayout: true,
    bracketPairColorization: { enabled: true },
    renderLineHighlight: 'all',
    scrollBeyondLastLine: false,
    smoothScrolling: true,
    tabSize: 2,
    insertSpaces: true,
    wordWrap: 'on',
    suggestOnTriggerCharacters: true,
    glyphMargin: !props.hideLineNumbers,
    folding: false,
    stickyScroll: { enabled: false },
    quickSuggestions: {
      other: true,
      comments: true,
      strings: true
    },
    acceptSuggestionOnCommitCharacter: true,
    suggest: {
      showKeywords: true,
      showSnippets: true,
      showClasses: true,
      showFunctions: true,
      showVariables: true,
      showModules: true,
      showProperties: true,
      showWords: true
    },
    guides: {
      indentation: false,
      highlightActiveIndentation: false,
      bracketPairs: false
    }
  });

  editor.onDidChangeModelContent(() => {
    code.value = editor?.getValue() || ''
  })

  // Обновляем обработчик Ctrl+S
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, async () => {
    const content = editor?.getValue() || ''
    const ext = filename.value.split('.').pop()?.toLowerCase()

    const mimeType = {
      'js': 'text/javascript',
      'ts': 'text/typescript',
      'py': 'text/x-python',
      'html': 'text/html',
      'css': 'text/css',
      'json': 'application/json',
    }[ext || ''] || 'text/plain'

    if ('showSaveFilePicker' in window) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: filename.value || 'code.txt',
          types: [{
            description: 'Code Files',
            accept: { [mimeType]: ['.' + (ext || 'txt')] },
          }],
        })
        const writable = await handle.createWritable();
        await writable.write(content);
        await writable.close();
      } catch (err) {
        console.log('Save cancelled')
      }
    } else {
      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');

      a.href = url;
      a.download = filename.value || 'code.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  })
})

const language = computed(() => {
  const ext = filename.value.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'js':
      return 'javascript'
    case 'ts':
      return 'typescript'
    case 'py':
      return 'python'
    case 'html':
      return 'html'
    case 'css':
      return 'css'
    case 'json':
      return 'json'
    default:
      return 'plaintext'
  }
})

watch([code, language], ([newCode, newLang]) => {
  if (!editor) return

  const model = editor.getModel()

  if (model) {
    monaco.editor.setModelLanguage(model, newLang)
  }

  if (editor.getValue() !== newCode) {
    editor.setValue(newCode || '')
  }
})

watch(() => props.fontSize, (newSize) => {
  if (editor && newSize) {
    editor.updateOptions({ fontSize: newSize })
  }
})

watch(() => props.hideLineNumbers, (newValue) => {
  if (editor) {
    editor.updateOptions({ lineNumbers: newValue ? 'off' : 'on' })
  }
})

async function playTyping(targetCode: string) {
  if (!editor || isPlaying.value) return

  isPlaying.value = true
  shouldStop.value = false
  emit('typing-start')
  editor.setValue('')

  for (let i = 0; i < targetCode.length; i++) {
    if (shouldStop.value || !isPlaying.value) break

    editor.setValue(targetCode.slice(0, i + 1))

    const position = editor.getModel()?.getPositionAt(i + 1)
    if (position) {
      editor.setPosition(position)
      editor.revealPositionInCenter(position)
    }

    await new Promise(resolve => setTimeout(resolve, props.speed))
  }

  isPlaying.value = false
  emit('typing-complete')
}

function stopTyping() {
  shouldStop.value = true
  isPlaying.value = false
}

// Экспортируем метод stopTyping
defineExpose({
  playTyping,
  recordingArea,
  clearEditor: () => editor?.setValue(''),
  stopTyping,
  setValue: (value: string) => editor?.setValue(value)
})
</script>

<template>
  <div ref="recordingArea" class="editor-wrapper" :class="{
    recording: props.isRecording,
    preview: props.isPreview,
    'default-size': !props.isRecording && !props.isPreview
  }" :style="{
    borderRadius: props.isRecording || props.isPreview ? `${props.borderRadius}px` : '0',
    border: props.showBorder && (props.isRecording || props.isPreview) ? `2px solid ${props.borderColor}` : 'none',
    outline: props.isRecording ? '2px solid #ff4444' : 'none',
    outlineOffset: props.isRecording ? '2px' : '0'
  }">
    <div class="mac-toolbar">
      <div class="window-controls">
        <span class="control close"></span>
        <span class="control minimize"></span>
        <span class="control maximize"></span>
      </div>
      <div class="window-title" v-if="props.title && (props.isRecording || props.isPreview)">{{ props.title }}</div>
      <slot name="tabs" />
    </div>
    <div class="editor-container">
      <div ref="editorContainer" class="editor-container" />
    </div>
  </div>
</template>

<style scoped>
.editor-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  background-color: #1e1e1e;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

/* Стиль по умолчанию (когда нет записи) */
.editor-wrapper.default-size {
  width: 100%;
  height: 100%;
  max-width: none;
  max-height: none;
}

.editor-wrapper.recording,
.editor-wrapper.preview {
  margin: 0 auto;
  width: v-bind('props.recordingWidth + "px"');
  height: v-bind('props.recordingHeight + "px"');
  position: relative;
  overflow: hidden;
}

.mac-toolbar {
  height: 38px;
  background-color: #2d2d2d;
  display: flex;
  align-items: center;
  padding: 0 12px;
  -webkit-app-region: drag;
  position: relative;
}

.window-controls {
  display: flex;
  gap: 8px;
  margin-right: 16px;
  margin-left: v-bind('props.hideLineNumbers ? "8px" : "0"');
}

.control {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  -webkit-app-region: no-drag;
}

.close {
  background-color: #ff5f56;
}

.minimize {
  background-color: #ffbd2e;
}

.maximize {
  background-color: #27c93f;
}

.editor-container {
  flex: 1;
  position: relative;
  min-height: 0;
  height: 100%;
}

:deep(.monaco-editor) {
  height: 100% !important;

  .margin-view-overlays {
    border-right: none !important;
  }

  .margin {
    position: relative;
    width: v-bind('props.hideLineNumbers ? "0 !important" : "auto"');

    &::after {
      content: '';
      position: absolute;
      right: 0;
      top: 0;
      bottom: 0;
      width: 1px;
      background-color: #3c3c3c;
      display: v-bind('props.hideLineNumbers ? "none" : "block"');
    }
  }

  .monaco-scrollable-element {
    left: v-bind('props.hideLineNumbers ? "0 !important" : "auto"');

    &>.scrollbar {
      &.vertical {
        width: 12px !important;

        .slider {
          width: 6px !important;
          left: 3px !important;
          background: rgba(255, 255, 255, 0.1) !important;
          border-radius: 3px !important;

          &:hover {
            background: rgba(255, 255, 255, 0.2) !important;
          }
        }
      }

      &.horizontal {
        display: none !important;
      }
    }
  }
}

.recording-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: transparent;
  z-index: 9999;
  cursor: not-allowed;
}

@media (max-width: 768px) {

  .editor-wrapper.recording,
  .editor-wrapper.preview {
    max-width: 100%;
    width: auto;
    height: auto;
    aspect-ratio: v-bind('props.recordingWidth + "/" + props.recordingHeight');
  }

  .mac-toolbar {
    height: 32px;
    padding: 0 8px;
  }

  .window-controls {
    display: none;
  }

  :deep(.monaco-editor) {
    font-size: 12px !important;
  }

  .recording-status {
    right: 16px;
    top: auto;
    bottom: 220px;
  }
}

.hide-filename :deep(.monaco-editor .title) {
  display: none !important;
}

.hide-filename :deep(.monaco-editor .editor-container) {
  margin-top: 0 !important;
}

/* Применяем небольшой scale во время записи для улучшения качества рендеринга */
.recording :deep(.monaco-editor),
.preview :deep(.monaco-editor) {
  transform: scale(1.0001);
  transform-origin: left top;
}

.window-title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  color: #888;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 50%;
  pointer-events: none;
}

.recording-status {
  position: fixed;
  top: 16px;
  right: 332px;
  background-color: rgba(0, 0, 0, 0.7);
  color: #fff;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 100;
}

.recording-dot {
  width: 8px;
  height: 8px;
  background-color: #ff4444;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }

  100% {
    opacity: 1;
  }
}
</style>