<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ScreenRecorder } from '../services/ScreenRecorder'
import { isMobileDevice } from '../utils/device'
import { ElMessage } from 'element-plus'
import 'element-plus/es/components/message/style/css'

type AspectRatio = '16:9' | '9:16' | '3:4' | 'custom'

const typingSpeed = defineModel<number>('speed')
const selectedRatio = defineModel<AspectRatio>('ratio', { default: '16:9' })
const recordingWidth = defineModel<number>('recordingWidth', { default: 1280 })
const recordingHeight = defineModel<number>('recordingHeight', { default: 720 })
const startDelay = defineModel<number>('startDelay', { default: 2000 })
const endDelay = defineModel<number>('endDelay', { default: 2000 })
const isRecording = ref(false)
const recorder = new ScreenRecorder()
const showPreview = defineModel<boolean>('preview', { default: false })
const hideFileName = defineModel<boolean>('hideFileName', { default: false })
const hideLineNumbers = defineModel<boolean>('hideLineNumbers', { default: false })
const fontSize = defineModel<number>('fontSize', { default: 14 })
const windowTitle = defineModel<string>('title', { default: '' })
const showBorder = defineModel<boolean>('showBorder', { default: false })
const borderColor = defineModel<string>('borderColor', { default: '#4444ff' })
const borderRadius = defineModel<number>('borderRadius', { default: 0 })

interface EditorRef {
  stopTyping: () => void
  playTyping: (code: string) => void
  clearEditor: () => void
  setValue: (value: string) => void
  recordingArea: HTMLElement | undefined
}

const props = defineProps<{
  recordingArea: HTMLElement | undefined,
  currentCode: string,
  editorRef?: EditorRef | null
}>()

const savedCode = ref('')
const emit = defineEmits<{
  'update:recording': [value: boolean],
  'clear-editor': [],
  'start-typing': [code: string],
  'typing-complete': []
}>()

const isMobile = computed(() => isMobileDevice())

async function startRecording() {
  if (isMobile.value) {
    ElMessage({
      message: 'Запись не поддерживается на мобильных устройствах',
      type: 'warning',
      duration: 3000
    })
    return
  }

  if (!props.recordingArea) {
    console.error('Recording area not found')
    return
  }

  try {
    // Сначала сохраняем код и очищаем редактор
    savedCode.value = props.currentCode
    emit('clear-editor')
    
    // Небольшая пауза после очистки
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Затем начинаем запись
    await recorder.startRecording(props.recordingArea)
    isRecording.value = true
    emit('update:recording', true)
    
    // Ждем заданную задержку
    await new Promise(resolve => setTimeout(resolve, startDelay.value))
    
    // Начинаем печатать
    emit('start-typing', savedCode.value)
  } catch (err) {
    console.error('Failed to start recording:', err)
    isRecording.value = false
    emit('update:recording', false)
  }
}

async function stopRecording() {
  if (!recorder.isRecording()) return
  
  // Останавливаем печать
  props.editorRef?.stopTyping()
  
  // Восстанавливаем исходный код
  await new Promise(resolve => setTimeout(resolve, 50))
  props.editorRef?.setValue(savedCode.value)
  
  await new Promise(resolve => setTimeout(resolve, 100))
  
  try {
    const blob = await recorder.stopRecording()
    if (blob.size > 0) {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'recording.webm'
      a.click()
      URL.revokeObjectURL(url)
    }
  } catch (err) {
    console.error('Failed to stop recording:', err)
  } finally {
    isRecording.value = false
    emit('update:recording', false)
  }
}

function getButtonText() {
  return isRecording.value 
    ? 'Остановить запись' 
    : 'Воспроизвести и начать запись'
}

async function handleTypingComplete() {
  if (isRecording.value) {
    if (recorder.isRecording()) {
      await new Promise(resolve => setTimeout(resolve, endDelay.value))
      stopRecording()
    }
  }
}

// Следим за изменением ratio
watch(selectedRatio, (newRatio) => {
  switch (newRatio) {
    case '16:9':
      recordingWidth.value = 1280
      recordingHeight.value = 720
      break
    case '9:16':
      recordingWidth.value = 405
      recordingHeight.value = 720
      break
    case '3:4':
      recordingWidth.value = 540
      recordingHeight.value = 720
      break
  }
})

// Следим за изменением размеров
watch([recordingWidth, recordingHeight], () => {
  const ratios = {
    '1280:720': '16:9',
    '405:720': '9:16',
    '540:720': '3:4'
  }
  const currentRatio = `${recordingWidth.value}:${recordingHeight.value}`
  selectedRatio.value = (ratios[currentRatio as keyof typeof ratios] || 'custom') as AspectRatio
})

// Следим за изменением заголовка
watch(windowTitle, (newTitle) => {
  if (newTitle) {
    hideFileName.value = true
  }
})

// Экспортируем методы для использования через ref
defineExpose({
  stopRecording,
  handleTypingComplete
})
</script>

<template>
  <div class="settings-wrapper">
    <el-form label-position="top">
      <el-form-item label="Соотношение сторон">
        <el-select v-model="selectedRatio" class="settings-select">
          <el-option label="Горизонтальное (16:9)" value="16:9" />
          <el-option label="Вертикальное (9:16)" value="9:16" />
          <el-option label="Вертикальное (3:4)" value="3:4" />
          <el-option label="Произвольное" value="custom" />
        </el-select>
      </el-form-item>

      <el-form-item label="Ширина записи (px)">
        <el-input-number 
          v-model="recordingWidth"
          :min="200"
          :max="1920"
          :step="1"
        />
      </el-form-item>

      <el-form-item label="Высота записи (px)">
        <el-input-number 
          v-model="recordingHeight"
          :min="1"
          :max="1080"
          :step="1"
        />
      </el-form-item>

      <el-form-item label="Скорость печати (мс)">
        <el-input-number 
          v-model="typingSpeed"
          :min="10"
          :max="1000"
          :step="10"
        />
      </el-form-item>

      <el-form-item label="Задержка перед началом (мс)">
        <el-input-number 
          v-model="startDelay"
          :min="0"
          :max="50000"
          :step="100"
        />
      </el-form-item>

      <el-form-item label="Задержка перед остановкой (мс)">
        <el-input-number 
          v-model="endDelay"
          :min="0"
          :max="50000"
          :step="100"
        />
      </el-form-item>

      <el-form-item label="Размер шрифта (px)">
        <el-input-number 
          v-model="fontSize"
          :min="10"
          :max="32"
          :step="1"
        />
      </el-form-item>

      <el-form-item label="Заголовок окна">
        <el-input v-model="windowTitle" placeholder="Введите заголовок" />
      </el-form-item>

      <el-form-item>
        <el-checkbox v-model="showPreview">Превью размера записи</el-checkbox>
      </el-form-item>

      <el-form-item>
        <el-checkbox 
          v-model="hideFileName" 
          :disabled="!!windowTitle"
          :title="windowTitle ? 'При установленном заголовке имя файла автоматически скрывается' : ''"
        >
          Скрыть название файла при записи
        </el-checkbox>
      </el-form-item>

      <el-form-item>
        <el-checkbox v-model="hideLineNumbers">Отключить нумерацию строк</el-checkbox>
      </el-form-item>

      <el-form-item>
        <el-checkbox v-model="showBorder">Показывать рамку</el-checkbox>
      </el-form-item>

      <el-form-item v-if="showBorder" label="Цвет рамки">
        <el-color-picker v-model="borderColor" />
      </el-form-item>

      <el-form-item v-if="showBorder" label="Закругление краёв (px)">
        <el-input-number 
          v-model="borderRadius"
          :min="0"
          :max="20"
          :step="1"
        />
      </el-form-item>

      <el-form-item>
        <el-button 
          type="primary" 
          class="record-btn"
          :disabled="isRecording && !recorder.isRecording() || isMobile"
          @click="isRecording ? stopRecording() : startRecording()"
          :title="isMobile ? 'Запись не поддерживается на мобильных устройствах' : ''"
        >
          {{ getButtonText() }}
        </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<style scoped>
.settings-wrapper {
  width: 300px;
  padding: 20px;
  background-color: #1e1e1e;
  border-left: 1px solid #2d2d2d;
  overflow-y: auto;
  color: #fff;
}

/* Медиа-запросы */
@media (max-width: 768px) {
  .settings-wrapper {
    width: 100%;
    border-left: none;
    border-top: 1px solid #2d2d2d;
    padding: 10px;
  }

  /* Компактный вид для мобильных */
  :deep(.el-form) {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  :deep(.el-form-item) {
    margin-bottom: 0;
    flex: 1;
    min-width: 200px;
  }

  .record-btn {
    width: 100%;
  }
}

/* Для очень маленьких экранов */
@media (max-width: 480px) {
  :deep(.el-form-item) {
    min-width: 100%;
  }
}

.settings-wrapper :deep(.el-form-item__label) {
  color: #888;
}

.settings-wrapper :deep(.el-input__wrapper),
.settings-wrapper :deep(.el-input-number__decrease),
.settings-wrapper :deep(.el-input-number__increase),
.settings-wrapper :deep(.el-select .el-input__wrapper) {
  background-color: #2d2d2d;
  box-shadow: none;
  border: none;
}

.settings-wrapper :deep(.el-input__inner),
.settings-wrapper :deep(.el-input-number__decrease),
.settings-wrapper :deep(.el-input-number__increase) {
  color: #fff;
}

.settings-wrapper :deep(.el-select-dropdown__item) {
  color: #fff;
}

.settings-wrapper :deep(.el-select-dropdown__item.hover),
.settings-wrapper :deep(.el-select-dropdown__item:hover) {
  background-color: #2d2d2d;
}

.settings-wrapper :deep(.el-popper) {
  background-color: #1e1e1e;
  border: 1px solid #2d2d2d;
}

.settings-select {
  width: 100%;
}

.generate-btn {
  width: 100%;
  background-color: #2d2d2d;
  border: none;
  color: #fff;
}

.generate-btn:hover {
  background-color: #3d3d3d;
  border: none;
}

.play-btn {
  width: 100%;
  margin-top: 10px;
}
</style> 