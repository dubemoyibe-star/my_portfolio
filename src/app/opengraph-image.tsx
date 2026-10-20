import { ImageResponse } from "next/og";

import { siteConfig } from "@/data/site";
import { getProfile } from "@/lib/data";
import { getSiteIdentity } from "@/lib/site-identity";

export const alt = "Portfolio profile";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const [identity, profile] = await Promise.all([
    getSiteIdentity(),
    getProfile(),
  ]);
  const portrait = profile.avatarCompact ?? profile.avatar;
  const portraitUrl = portrait
    ? new URL(portrait.src, siteConfig.url).toString()
    : null;

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
            color: "#00d9a3",
            fontSize: 20,
            letterSpacing: 4,
            textTransform: "uppercase",
          }}
        >
          Portfolio / Profile
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 36,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 18, width: 620 }}>
            <div
              style={{
                fontSize: 74,
                fontWeight: 600,
                letterSpacing: -3,
                lineHeight: 1.05,
              }}
            >
              {identity.name}
            </div>
            <div style={{ color: "#8a949d", fontSize: 32 }}>
              {identity.role}
            </div>
          </div>
          {portraitUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={portraitUrl}
              alt={portrait?.alt || `picture of ${profile.name}`}
              width={370}
              height={370}
              style={{
                width: 370,
                height: 370,
                borderRadius: 999,
                border: "4px solid #00d9a3",
                objectFit: "cover",
              }}
            />
          ) : null}
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
          <div>oyibe.dev</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
