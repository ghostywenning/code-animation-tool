<script setup lang="ts">
import { ref, watch } from 'vue'
import CodeEditor from '../components/CodeEditor.vue'
import CodeEditorTabs from '../components/CodeEditorTabs.vue'
import ExportSettings from '../components/ExportSettings.vue'
import { StorageService } from '../services/StorageService'

interface Tab {
  name: string
  content: string
}

const activeTab = ref('0')
const tabs = ref<Tab[]>([
  { name: 'code.ts', content: '' }
])

// Загружаем настройки при старте
const savedSettings = StorageService.loadSettings() || StorageService.getDefaultSettings()

const typingSpeed = ref(savedSettings.typingSpeed)
const selectedRatio = ref(savedSettings.selectedRatio)
const startDelay = ref(savedSettings.startDelay)
const endDelay = ref(savedSettings.endDelay)
const recordingWidth = ref(savedSettings.recordingWidth)
const recordingHeight = ref(savedSettings.recordingHeight)
const showPreview = ref(savedSettings.showPreview)
const hideFileName = ref(savedSettings.hideFileName)
const fontSize = ref(savedSettings.fontSize)

// Следим за изменениями настроек и сохраняем их
watch(
  [
    typingSpeed,
    selectedRatio,
    startDelay,
    endDelay,
    recordingWidth,
    recordingHeight,
    showPreview,
    hideFileName,
    fontSize
  ],
  () => {
    StorageService.saveSettings({
      typingSpeed: typingSpeed.value,
      selectedRatio: selectedRatio.value,
      startDelay: startDelay.value,
      endDelay: endDelay.value,
      recordingWidth: recordingWidth.value,
      recordingHeight: recordingHeight.value,
      showPreview: showPreview.value,
      hideFileName: hideFileName.value,
      fontSize: fontSize.value
    })
  },
  { deep: true }
)

// Определяем тип для editorRef
interface EditorRef {
  stopTyping: () => void
  playTyping: (code: string) => void
  clearEditor: () => void
  setValue: (value: string) => void
  recordingArea: HTMLElement | undefined
}

// Обновляем тип ref
const editorRef = ref<EditorRef | null>(null)

const isRecording = ref(false)
const exportSettingsRef = ref<InstanceType<typeof ExportSettings> | null>(null)

function handleRecordingChange(value: boolean) {
  isRecording.value = value
}

function handleClearEditor() {
  editorRef.value?.clearEditor()
}

function handleStartTyping(code: string) {
  editorRef.value?.playTyping(code)
}

function handleTypingComplete() {
  if (isRecording.value) {
    exportSettingsRef.value?.handleTypingComplete()
  }
}
</script>

<template>
  <div class="main-container">
    <div class="editor-section">
      <CodeEditor
        ref="editorRef"
        v-model="tabs[Number(activeTab)].content"
        v-model:filename="tabs[Number(activeTab)].name"
        :speed="typingSpeed"
        :is-recording="isRecording"
        :ratio="selectedRatio"
        :recording-width="recordingWidth"
        :recording-height="recordingHeight"
        :is-preview="showPreview"
        :hide-file-name="hideFileName"
        :font-size="fontSize"
        @typing-complete="handleTypingComplete"
      >
        <template #tabs>
          <CodeEditorTabs
            v-if="(!isRecording && !showPreview) || !hideFileName"
            v-model:tabs="tabs"
            v-model:activeTab="activeTab"
            :is-recording="isRecording"
          />
        </template>
      </CodeEditor>
    </div>
    <ExportSettings
      class="settings-panel"
      ref="exportSettingsRef"
      v-model:speed="typingSpeed"
      v-model:ratio="selectedRatio"
      v-model:recording-width="recordingWidth"
      v-model:recording-height="recordingHeight"
      v-model:start-delay="startDelay"
      v-model:end-delay="endDelay"
      v-model:preview="showPreview"
      v-model:hide-file-name="hideFileName"
      v-model:font-size="fontSize"
      :recording-area="editorRef?.recordingArea"
      :current-code="tabs[Number(activeTab)].content"
      :editor-ref="editorRef"
      @update:recording="handleRecordingChange"
      @clear-editor="handleClearEditor"
      @start-typing="handleStartTyping"
    />
  </div>
</template>

<style scoped>
.main-container {
  display: flex;
  flex-direction: row;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background-color: #1a1a1a;
}

.editor-section {
  flex: 1;
  height: 100%;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Медиа-запросы для адаптивности */
@media (max-width: 768px) {
  .main-container {
    flex-direction: column;
  }

  .editor-section {
    flex: 1;
    min-height: 0;
  }

  .settings-panel {
    width: 100% !important;
    height: auto;
    max-height: 200px;
  }
}
</style> 