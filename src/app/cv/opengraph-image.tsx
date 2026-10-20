import { ImageResponse } from "next/og";

import { getSiteIdentity } from "@/lib/site-identity";

export const alt = "CV and resume";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

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
          padding: "64px 76px",
          background: "#0a0e12",
          color: "#e4e9ed",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            color: "#8a949d",
            fontSize: 20,
            letterSpacing: 4,
            textTransform: "uppercase",
          }}
        >
          {identity.name.toUpperCase()} / PROFESSIONAL PROFILE
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <div style={{ color: "#00d9a3", fontSize: 104, fontWeight: 700 }}>
            CV
          </div>
          <div style={{ color: "#8a949d", fontSize: 64 }}>/ RESUME</div>
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
          <div>{identity.role}</div>
          <div>oyibe.dev/cv</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
