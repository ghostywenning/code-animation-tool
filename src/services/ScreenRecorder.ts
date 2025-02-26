import html2canvas from 'html2canvas';
import { isMobileDevice } from '../utils/device';

export class ScreenRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;
  private animationFrame: number | null = null;

  async startRecording(element: HTMLElement) {
    if (isMobileDevice()) {
      throw new Error('Recording is not supported on mobile devices');
    }

    try {
      // Создаем canvas с размерами элемента с учетом масштаба экрана
      this.canvas = document.createElement('canvas');
      const rect = element.getBoundingClientRect();
      const scale = window.devicePixelRatio;
      this.canvas.width = rect.width * scale;
      this.canvas.height = rect.height * scale;
      this.context = this.canvas.getContext('2d');

      if (!this.context) {
        throw new Error('Failed to get canvas context');
      }

      // Масштабируем контекст
      this.context.scale(scale, scale);

      // Небольшая задержка для инициализации canvas
      await new Promise(resolve => setTimeout(resolve, 100));

      // Получаем поток с canvas
      this.stream = this.canvas.captureStream(60);

      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 5000000
      });
      
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          this.chunks.push(e.data);
        }
      };

      // Начинаем запись кадров
      const captureFrame = async () => {
        if (!this.context || !this.canvas || !element) {
          console.warn('Missing required objects for frame capture');
          return;
        }

        try {
          // Создаем снимок элемента
          const snapshot = await html2canvas(element, {
            backgroundColor: null,
            logging: false,
            scale: window.devicePixelRatio,
            useCORS: true,
            allowTaint: true,
            width: rect.width,  // используем оригинальную ширину
            height: rect.height // используем оригинальную высоту
          });
          
          // Проверяем, что контекст все еще существует
          if (this.context && this.canvas) {
            // Очищаем canvas
            this.context.clearRect(0, 0, rect.width, rect.height); // очищаем с учетом оригинальных размеров
            
            // Рисуем снимок на canvas
            this.context.drawImage(snapshot, 0, 0, rect.width, rect.height);
            
            // Запрашиваем следующий кадр только если запись все еще идет
            if (this.mediaRecorder?.state === 'recording') {
              this.animationFrame = requestAnimationFrame(captureFrame);
            }
          }
        } catch (err) {
          console.error('Error capturing frame:', err);
        }
      };

      // Запускаем анимацию
      this.animationFrame = requestAnimationFrame(captureFrame);
      
      // Начинаем запись
      this.mediaRecorder.start(100);
    } catch (err) {
      console.error('Error starting recording:', err);
      this.cleanup();
      throw err;
    }
  }

  stopRecording(): Promise<Blob> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        resolve(new Blob([], { type: 'video/webm' }));
        return;
      }

      // Флаг для отслеживания последнего чанка
      let lastChunkReceived = false;

      // Обработчик для данных
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          this.chunks.push(e.data);
          lastChunkReceived = true;
        }
      };

      this.mediaRecorder.onstop = () => {
        // Ждем получения последнего чанка перед созданием blob
        const waitForLastChunk = () => {
          if (lastChunkReceived) {
            // Создаем blob с правильными настройками кодека
            const blob = new Blob(this.chunks, { 
              type: 'video/webm;codecs=vp9,opus'
            });
            
            // Очищаем ресурсы
            this.cleanup();
            
            // Даем браузеру время на финализацию
            setTimeout(() => {
              resolve(blob);
            }, 500);
          } else {
            // Проверяем каждые 100мс
            setTimeout(waitForLastChunk, 100);
          }
        };

        waitForLastChunk();
      };

      // Запрашиваем последний чанк данных
      this.mediaRecorder.requestData();
      // Останавливаем запись
      this.mediaRecorder.stop();
    });
  }

  private cleanup() {
    // Останавливаем анимацию
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    // Очищаем поток
    if (this.stream) {
      this.stream.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Error stopping track:', e);
        }
      });
      this.stream = null;
    }

    // Очищаем canvas
    if (this.canvas) {
      this.canvas.width = 0;
      this.canvas.height = 0;
      this.canvas = null;
      this.context = null;
    }

    this.mediaRecorder = null;
    this.chunks = [];
  }

  isRecording(): boolean {
    return this.mediaRecorder !== null && this.mediaRecorder.state === 'recording';
  }
} 