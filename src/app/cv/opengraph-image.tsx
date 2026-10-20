import { ImageResponse } from "next/og";

import { siteConfig } from "@/data/site";
import { getProfile } from "@/lib/data";
import { getSiteIdentity } from "@/lib/site-identity";

export const alt = "CV and resume";
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
        <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
          {portraitUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={portraitUrl}
              alt={portrait?.alt || `Picture of ${profile.name}`}
              width={136}
              height={136}
              style={{
                width: 136,
                height: 136,
                borderRadius: 999,
                border: "3px solid #00d9a3",
                objectFit: "cover",
              }}
            />
          ) : null}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontSize: 42, fontWeight: 600 }}>
              {identity.name}
            </div>
            <div style={{ color: "#8a949d", fontSize: 24 }}>
              {identity.role}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <div style={{ color: "#00d9a3", fontSize: 104, fontWeight: 700 }}>CV</div>
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
