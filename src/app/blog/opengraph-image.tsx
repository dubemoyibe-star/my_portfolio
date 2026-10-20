import { ImageResponse } from "next/og";

import { getSiteIdentity } from "@/lib/site-identity";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Writing on building products and the decisions behind the work";

export default async function OpenGraphImage() {
  const identity = await getSiteIdentity();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "58px 72px",
          background: "#0a0e12",
          color: "#e4e9ed",
          fontFamily: "Arial, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 34, height: 3, background: "#00d9a3" }} />
          <div
            style={{
              color: "#6b7680",
              fontSize: 19,
              letterSpacing: 3,
              textTransform: "uppercase",
            }}
          >
            Portfolio / Journal
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ fontSize: 96, fontWeight: 600, letterSpacing: -5 }}>
            Notes from the build
          </div>
          <div style={{ color: "#8a949d", fontSize: 30, lineHeight: 1.4 }}>
            Ideas, lessons, and details behind the work.
          </div>
        </div>

        <div
          style={{
            borderTop: "1px solid #1e262e",
            paddingTop: 18,
            display: "flex",
            justifyContent: "space-between",
            color: "#6b7680",
            fontSize: 18,
            fontFamily: "monospace",
          }}
        >
          <div>{identity.name.toUpperCase()}</div>
          <div>oyibe.dev / writing</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
