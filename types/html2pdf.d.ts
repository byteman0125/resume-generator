declare module "html2pdf.js" {
  interface Html2PdfOptions {
    margin?: number | number[];
    filename?: string;
    image?: { type?: string; quality?: number };
    html2canvas?: Record<string, unknown>;
    jsPDF?: Record<string, unknown>;
    pagebreak?: { mode?: string | string[]; before?: string; after?: string; avoid?: string };
  }

  interface Html2PdfInstance {
    set(option: Html2PdfOptions): Html2PdfInstance;
    save(): Promise<void>;
    from(element: HTMLElement): Html2PdfInstance;
    outputPdf(type?: string): Promise<unknown>;
    toPdf(): Html2PdfInstance;
    get(type: string): Promise<unknown>;
  }

  function html2pdf(): Html2PdfInstance;
  function html2pdf(element: HTMLElement, options?: Html2PdfOptions): Html2PdfInstance;

  export = html2pdf;
}
