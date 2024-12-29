<script setup lang="ts">
import { ref, computed } from 'vue'
import { ScreenRecorder } from '../services/ScreenRecorder'
import { isMobileDevice } from '../utils/device'
import { ElMessage } from 'element-plus'
import 'element-plus/es/components/message/style/css'

const typingSpeed = defineModel<number>('speed')
const isRecording = ref(false)
const recorder = new ScreenRecorder()

const props = defineProps<{
  recordingArea: HTMLElement | undefined,
  currentCode: string
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
    // Сначала начинаем запись
    await recorder.startRecording(props.recordingArea)
    isRecording.value = true
    emit('update:recording', true)

    // Сохраняем код и очищаем редактор
    savedCode.value = props.currentCode
    emit('clear-editor')
    
    // Небольшая задержка перед началом печати
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Начинаем печатать сохраненный код
    emit('start-typing', savedCode.value)
  } catch (err) {
    console.error('Failed to start recording:', err)
    isRecording.value = false
    emit('update:recording', false)
  }
}

async function stopRecording() {
  if (!recorder.isRecording()) return
  
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
    // Добавляем задержку в 1 секунду перед остановкой записи
    await new Promise(resolve => setTimeout(resolve, 1000));
    stopRecording();
  }
}

// Экспортируем методы для использования через ref
defineExpose({
  stopRecording,
  handleTypingComplete
})
</script>

<template>
  <div class="settings-wrapper">
    <el-form label-position="top">
      <el-form-item label="Скорость печати (мс)">
        <el-input-number 
          v-model="typingSpeed"
          :min="10"
          :max="1000"
          :step="10"
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