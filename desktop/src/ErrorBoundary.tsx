import React from "react";

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div
          style={{
            padding: 24,
            fontFamily: "system-ui, sans-serif",
            background: "#1e293b",
            color: "#e2e8f0",
            minHeight: "100vh",
            overflow: "auto",
          }}
        >
          <h1 style={{ margin: "0 0 16px 0", fontSize: 18 }}>Something went wrong</h1>
          <pre
            style={{
              margin: 0,
              padding: 16,
              background: "#0f172a",
              borderRadius: 8,
              fontSize: 12,
              overflow: "auto",
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
            }}
          >
            {this.state.error.message}
          </pre>
          {this.state.error.stack && (
            <pre
              style={{
                marginTop: 16,
                padding: 16,
                background: "#0f172a",
                borderRadius: 8,
                fontSize: 11,
                overflow: "auto",
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
              }}
            >
              {this.state.error.stack}
            </pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
