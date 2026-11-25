/**
 * pdfjs-dist ships types only for its root entry point. The client bundle
 * uses the lighter `build/pdf.mjs` entry, so declare a minimal surface here.
 */
declare module "pdfjs-dist/build/pdf.mjs" {
  export interface PDFPageViewport {
    width: number;
    height: number;
    scale: number;
  }

  export interface PDFPageProxy {
    getViewport(options: { scale: number }): PDFPageViewport;
    render(params: {
      canvasContext: CanvasRenderingContext2D;
      viewport: PDFPageViewport;
      canvas?: HTMLCanvasElement;
    }): { promise: Promise<void> };
    cleanup(): void;
  }

  export interface PDFDocumentProxy {
    numPages: number;
    getPage(pageNumber: number): Promise<PDFPageProxy>;
    destroy(): Promise<void>;
  }

  export interface PDFDocumentLoadingTask {
    promise: Promise<PDFDocumentProxy>;
  }

  export const GlobalWorkerOptions: {
    workerSrc: string;
  };

  export function getDocument(params: {
    data?: Uint8Array;
    url?: string;
  }): PDFDocumentLoadingTask;
}
