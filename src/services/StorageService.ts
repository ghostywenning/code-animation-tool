interface Settings {
  typingSpeed: number
  selectedRatio: '16:9' | '9:16' | '3:4'
  startDelay: number
  endDelay: number
  recordingWidth: number
  recordingHeight: number
  showPreview: boolean
  hideFileName: boolean
  fontSize: number
  lastTabs: Array<{
    name: string
    content: string
  }>
  activeTab: string
  hideLineNumbers: boolean
  windowTitle: string
}

const STORAGE_KEY = 'code-animation-settings'

export class StorageService {
  static saveSettings(settings: Settings): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }

  static loadSettings(): Settings | null {
    const settings = localStorage.getItem(STORAGE_KEY)
    if (!settings) return null

    try {
      return JSON.parse(settings)
    } catch {
      return null
    }
  }

  static getDefaultSettings(): Settings {
    return {
      typingSpeed: 100,
      selectedRatio: '16:9',
      startDelay: 2000,
      endDelay: 2000,
      recordingWidth: 1280,
      recordingHeight: 720,
      showPreview: false,
      hideFileName: false,
      fontSize: 14,
      lastTabs: [{ name: 'code.ts', content: '' }],
      activeTab: '0',
      hideLineNumbers: false,
      windowTitle: '',
    }
  }
} 