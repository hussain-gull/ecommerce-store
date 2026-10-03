"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";

// Last-resort boundary: replaces the ROOT layout, so it must render its own
// <html>/<body> and can't rely on Tailwind/global CSS or providers — hence the
// small inline styles. Only reached when the root layout itself throws.
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          background: "#fff",
          color: "#141414",
          textAlign: "center",
          padding: 24,
        }}
      >
        <div style={{ maxWidth: 420 }}>
          <h1
            style={{
              fontSize: 24,
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            Something went wrong
          </h1>
          <p style={{ color: "#555", lineHeight: 1.7 }}>
            The site hit an unexpected problem. Please try again in a moment.
          </p>
          <button
            type="button"
            onClick={() => retry()}
            style={{
              marginTop: 16,
              height: 44,
              padding: "0 32px",
              background: "#141414",
              color: "#fff",
              border: "none",
              fontWeight: 700,
              letterSpacing: 2,
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
          {error.digest && (
            <p style={{ marginTop: 24, fontSize: 11, color: "#888" }}>
              Reference: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
