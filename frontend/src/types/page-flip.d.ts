declare module 'page-flip' {
  export interface PageFlipOptions {
    width: number;
    height: number;
    showCover?: boolean;
    maxShadowOpacity?: number;
    mobileScrollSupport?: boolean;
    flippingTime?: number;
    useMouseEvents?: boolean;
    swipeDistance?: number;
    startPage?: number;
    drawShadow?: boolean;
    autoSize?: boolean;
  }

  export class PageFlip {
    constructor(element: HTMLElement, options: PageFlipOptions);
    loadFromHTML(pages: HTMLElement[]): void;
    flipNext(corner?: string): void;
    flipPrev(corner?: string): void;
    flip(pageNum: number, corner?: string): void;
    on(event: string, callback: (e: any) => void): void;
    destroy(): void;
    getCurrentPageIndex(): number;
    getPageCount(): number;
  }
}
