<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import * as monaco from 'monaco-editor'

// Настраиваем Web Workers

const code = defineModel<string>('modelValue')
const filename = defineModel<string>('filename', { default: '' })
const props = defineProps<{
  speed: number
  isRecording?: boolean
}>()
const editorContainer = ref<HTMLElement>()
let editor: monaco.editor.IStandaloneCodeEditor | null = null
const isPlaying = ref(false)
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
    fontSize: 14,
    lineNumbers: 'on',
    automaticLayout: true,
    bracketPairColorization: { enabled: true },
    renderLineHighlight: 'all',
    scrollBeyondLastLine: false,
    smoothScrolling: true,
    tabSize: 2,
    wordWrap: 'on',
    suggestOnTriggerCharacters: true,
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
    }
  });

  editor.onDidChangeModelContent(() => {
    code.value = editor?.getValue() || ''
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

async function playTyping(targetCode: string) {
  if (!editor || isPlaying.value) return
  
  isPlaying.value = true
  emit('typing-start')
  editor.setValue('')
  
  for (let i = 0; i < targetCode.length; i++) {
    if (!isPlaying.value) break
    
    editor.setValue(targetCode.slice(0, i + 1))
    await new Promise(resolve => setTimeout(resolve, props.speed))
  }
  
  isPlaying.value = false
  emit('typing-complete')
}

// Экспортируем дополнительные методы
defineExpose({
  playTyping,
  recordingArea,
  clearEditor: () => editor?.setValue('')
})
</script>

<template>
  <div 
    ref="recordingArea"
    class="editor-wrapper"
    :class="{ recording: props.isRecording }"
  >
    <div 
      v-if="props.isRecording" 
      class="recording-overlay"
    />
    
    <div class="mac-toolbar">
      <div class="window-controls">
        <span class="control close"></span>
        <span class="control minimize"></span>
        <span class="control maximize"></span>
      </div>
      <slot name="tabs" :is-recording="props.isRecording"></slot>
    </div>
    <div class="editor-container">
      <div 
        ref="editorContainer" 
        class="editor-container"
      />
    </div>
  </div>
</template>

<style scoped>
.editor-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #1e1e1e;
  transition: box-shadow 0.3s ease;
}

.editor-wrapper.recording {
  box-shadow: 0 0 0 2px #ff4444;
}

.mac-toolbar {
  height: 38px;
  background-color: #2d2d2d;
  display: flex;
  align-items: center;
  padding: 0 12px;
  -webkit-app-region: drag;
}

.window-controls {
  display: flex;
  gap: 8px;
  margin-right: 16px;
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

/* Медиа-запросы */
@media (max-width: 768px) {
  .mac-toolbar {
    height: 32px;
    padding: 0 8px;
  }

  .window-controls {
    display: none; /* Скрываем кнопки окна на мобильных */
  }

  :deep(.monaco-editor) {
    /* Уменьшаем размер шрифта на мобильных */
    font-size: 12px !important;
  }
}
</style> 