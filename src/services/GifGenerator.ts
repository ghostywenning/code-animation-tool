import GIF from 'gif.js';

export class GifGenerator {
  private gif: any;
  
  constructor(options = {}) {
    this.gif = new GIF({
      workers: 2,
      quality: 10,
      workerScript: '/gif.worker.js',
      ...options
    });
  }

  addFrame(element: HTMLElement, delay: number) {
    this.gif.addFrame(element, { delay });
  }

  generate(): Promise<Blob> {
    return new Promise((resolve) => {
      this.gif.on('finished', (blob: Blob) => {
        resolve(blob);
      });
      this.gif.render();
    });
  }
} 