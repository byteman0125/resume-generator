"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ padding: "2rem", fontFamily: "system-ui", background: "#fff", color: "#111" }}>
        <h1>Something went wrong</h1>
        <p>{error.message}</p>
        <button type="button" onClick={reset} style={{ marginTop: "1rem", padding: "0.5rem 1rem" }}>
          Try again
        </button>
      </body>
    </html>
  );
}
