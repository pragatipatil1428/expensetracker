import { ImageResponse } from "next/og";

export const alt = "FinTrack — Personal Finance & Expense Tracker";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f0f14 0%, #17142b 55%, #1b1035 100%)",
          padding: "72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 32,
              fontWeight: 800,
            }}
          >
            ₹
          </div>
          <div style={{ color: "#ffffff", fontSize: 44, fontWeight: 800, letterSpacing: -1 }}>
            FinTrack
          </div>
        </div>
        <div
          style={{
            marginTop: 36,
            color: "#ffffff",
            fontSize: 64,
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: -2,
            maxWidth: 900,
          }}
        >
          Know exactly where your money goes
        </div>
        <div
          style={{
            marginTop: 20,
            color: "#a1a1c4",
            fontSize: 28,
            lineHeight: 1.5,
            maxWidth: 820,
          }}
        >
          Track income & expenses · Set budgets · Manage recurring bills · Beautiful analytics
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 40 }}>
          <div
            style={{
              background: "rgba(255,255,255,0.08)",
              borderRadius: 999,
              padding: "10px 24px",
              color: "#d4d4f2",
              fontSize: 22,
              border: "1px solid rgba(255,255,255,0.14)",
            }}
          >
            Personal Finance &amp; Expense Tracker
          </div>
        </div>
      </div>
    ),
    size,
  );
}
