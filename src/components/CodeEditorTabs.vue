<template>
  <div class="tabs-container" @wheel="handleWheel">
    <div class="tabs-wrapper">
      <template v-if="props.isRecording">
        <div 
          class="tab active"
          v-if="tabs[Number(activeTab)]"
        >
          <span class="filename-text">
            {{ tabs[Number(activeTab)].name }}
          </span>
        </div>
      </template>
      <template v-else>
        <div
          v-for="(tab, index) in tabs"
          :key="index"
          :class="['tab', { active: activeTab === String(index) }]"
          @click="activeTab = String(index)"
        >
          <el-input
            v-if="editingFileName === index"
            v-model="tabs[index].name"
            size="small"
            class="filename-input"
            @blur="editingFileName = null"
            @keyup.enter="editingFileName = null"
            v-focus
          />
          <span
            v-else
            class="filename-text"
            @dblclick="editingFileName = index"
          >
            {{ tab.name }}
          </span>
          <el-icon 
            class="close-icon" 
            @click.stop="removeTab(String(index))"
          >
            <Close />
          </el-icon>
        </div>
        <el-button
          class="add-tab-button"
          size="small"
          circle
          @click="addTab"
        >
          <el-icon><Plus /></el-icon>
        </el-button>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessageBox } from 'element-plus'
import 'element-plus/es/components/message-box/style/css'

interface Tab {
  name: string
  content: string
}

const props = defineProps<{
  isRecording?: boolean
}>()

const tabs = defineModel<Tab[]>('tabs', {
    default: () => []
})
const activeTab = defineModel<string>('activeTab')
const editingFileName = ref<number | null>(null)

const addTab = () => {
  const newTabName = `code${tabs.value.length + 1}.ts`
  tabs.value.push({
    name: newTabName,
    content: ''
  })
  activeTab.value = String(tabs.value.length - 1)
  
  setTimeout(() => {
    const tabsContainer = document.querySelector('.tabs-container')
    if (tabsContainer) {
      tabsContainer.scrollTo({
        left: tabsContainer.scrollWidth,
        behavior: 'smooth'
      })
    }
  })
}

const removeTab = async (targetName: string) => {
  const index = Number(targetName)
  const tab = tabs.value[index]
  
  if (tab.content.trim()) {
    try {
      await ElMessageBox.confirm(
        'В файле есть несохраненные изменения. Вы уверены, что хотите закрыть его?',
        'Предупреждение',
        {
          confirmButtonText: 'Да',
          cancelButtonText: 'Нет',
          type: 'warning'
        }
      )
    } catch {
      return
    }
  }

  if (tabs.value.length === 1) {
    tabs.value[0].content = ''
    tabs.value[0].name = 'code.ts'
    return
  }

  tabs.value = tabs.value.filter((_, i) => i !== index)
  if (activeTab.value === targetName) {
    activeTab.value = String(Math.max(0, index - 1))
  } else if (Number(activeTab.value) > index) {
    activeTab.value = String(Number(activeTab.value) - 1)
  }
}

const handleWheel = (event: WheelEvent) => {
  const container = event.currentTarget as HTMLElement
  if (container) {
    if (event.deltaY !== 0) {
      event.preventDefault()
      container.scrollLeft += event.deltaY
    }
  }
}

const vFocus = {
  mounted: (el: HTMLElement) => {
    setTimeout(() => {
      const input = el.querySelector('.el-input__inner') as HTMLInputElement
      if (input) {
        input.focus()
        input.select()
      }
    }, 0)
  }
}
</script>

<style scoped>
.tabs-container {
  display: flex;
  align-items: flex-end;
  height: 100%;
  margin-left: 16px;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-app-region: no-drag;
  -ms-overflow-style: none;
  scrollbar-width: none;
  scroll-behavior: smooth;
}

.tabs-container::-webkit-scrollbar {
  display: none;
}

.tabs-wrapper {
  display: flex;
  align-items: flex-end;
  min-width: min-content;
  height: 100%;
  gap: 4px;
  padding-bottom: 0;
}

.tab {
  position: relative;
  display: flex;
  align-items: center;
  padding: 0 16px;
  height: 32px;
  color: #888;
  cursor: pointer;
  background-color: #252525;
  border-radius: 6px 6px 0 0;
  z-index: 1;
  transition: all 0.2s ease;
}

.tab.active {
  color: #fff;
  background-color: #1e1e1e;
  z-index: 2;
}

.tab:hover {
  background-color: #2a2a2a;
}

.close-icon {
  margin-left: 8px;
  font-size: 14px;
  opacity: 0;
  transition: opacity 0.2s;
}

.tab:hover .close-icon {
  opacity: 0.8;
}

.tab:hover .close-icon:hover {
  opacity: 1;
}

.add-tab-button {
  flex-shrink: 0;
  margin-left: 4px;
  height: 24px;
  width: 24px;
  padding: 0;
  align-self: center;
  margin-top: 3px;
  background-color: #252525;
  border: none;
  color: #888;
  transition: all 0.2s ease;
}

.add-tab-button :deep(.el-icon) {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.add-tab-button:hover {
  background-color: #2a2a2a;
  color: #fff;
}

.add-tab-button:focus {
  box-shadow: none;
}

.filename-input {
  width: 100px;
  margin: -6px 0;
}

.filename-input :deep(.el-input__wrapper) {
  background-color: transparent;
  box-shadow: none !important;
  padding: 0 8px;
}

.filename-input :deep(.el-input__inner) {
  color: #fff;
  height: 24px;
}

.filename-text {
  user-select: none;
}

.recording .tab {
  border-radius: 6px 6px 0 0;
  background-color: #1e1e1e;
  color: #fff;
}

@media (max-width: 768px) {
  .tabs-container {
    margin-left: 8px;
  }

  .tab {
    padding: 0 12px;
    height: 28px;
    font-size: 12px;
  }

  .add-tab-button {
    height: 20px;
    width: 20px;
  }

  /* Скрываем кнопки закрытия на мобильных */
  .close-icon {
    display: none;
  }
}

/* Для очень маленьких экранов */
@media (max-width: 480px) {
  .tab {
    padding: 0 8px;
    max-width: 120px;
  }

  .filename-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
