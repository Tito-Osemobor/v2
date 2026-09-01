import { ImageResponse } from "next/og";
import { siteContent } from "@/content/site";

const size = { width: 1200, height: 630 };

export async function GET(request: Request) {
  const markUrl = new URL(
    "/icons/android-chrome-512x512.png",
    request.url,
  ).toString();

  return new ImageResponse(
    <div
      style={{
        alignItems: "stretch",
        background: "#f7f7f4",
        color: "#06265b",
        display: "flex",
        height: "100%",
        padding: "72px",
        width: "100%",
      }}
    >
      <div
        style={{
          border: "2px solid #cbd4e3",
          borderRadius: "44px",
          display: "flex",
          flex: 1,
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "58px 64px",
        }}
      >
        <div style={{ alignItems: "center", display: "flex", gap: "28px" }}>
          {/* The social image renderer supports standard img elements. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={markUrl}
            alt=""
            width="112"
            height="112"
            style={{
              borderRadius: "24px",
              height: 104,
              objectFit: "cover",
              width: 104,
            }}
          />
          <div
            style={{
              color: "#2457e6",
              display: "flex",
              fontSize: 26,
              fontWeight: 650,
            }}
          >
            titoosemobor.com
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div
            style={{
              display: "flex",
              fontSize: 76,
              fontWeight: 650,
              letterSpacing: "-4px",
              lineHeight: 1,
            }}
          >
            {siteContent.identity.name}
          </div>
          <div style={{ color: "#4e5f78", display: "flex", fontSize: 32 }}>
            {siteContent.identity.role} · {siteContent.identity.location}
          </div>
        </div>
      </div>
    </div>,
    size,
  );
}
