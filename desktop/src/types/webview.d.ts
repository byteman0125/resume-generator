declare namespace JSX {
  interface IntrinsicElements {
    webview: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      src?: string;
      allowpopups?: boolean;
      /** Persistent partition so cookies/storage are saved to disk (e.g. "persist:deepseek"). */
      partition?: string;
    };
  }
}

