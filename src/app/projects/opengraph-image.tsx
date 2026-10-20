import { ImageResponse } from "next/og";

export const alt = "Selected projects by Oyibe Chidubem";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0a0e12",
          color: "#e4e9ed",
          width: "100%",
          height: "100%",
          display: "flex",
          padding: "58px 72px",
          fontFamily: "Arial, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 72,
            top: 58,
            bottom: 58,
            width: 2,
            background: "#1e262e",
          }}
        />
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            paddingLeft: 28,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 34,
                height: 3,
                background: "#00d9a3",
              }}
            />
            <div
              style={{
                color: "#6b7680",
                fontSize: 19,
                letterSpacing: 3,
                textTransform: "uppercase",
              }}
            >
              Portfolio / Selected work
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 48,
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                width: 610,
              }}
            >
              <div
                style={{
                  fontSize: 88,
                  fontWeight: 600,
                  letterSpacing: -4,
                  lineHeight: 1,
                }}
              >
                Projects
              </div>
              <div
                style={{
                  marginTop: 22,
                  color: "#6b7680",
                  fontSize: 28,
                  lineHeight: 1.4,
                  maxWidth: 560,
                }}
              >
                Products and experiments, built with purpose.
              </div>
            </div>

            <div
              style={{
                width: 360,
                height: 268,
                border: "1px solid #2a343e",
                borderRadius: 8,
                background: "#12171d",
                display: "flex",
                flexDirection: "column",
                padding: 18,
                gap: 14,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderBottom: "1px solid #1e262e",
                  paddingBottom: 13,
                }}
              >
                <div style={{ display: "flex", gap: 6 }}>
                  {["#6b7680", "#2a343e", "#2a343e"].map((color, index) => (
                    <div
                      key={index}
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: 99,
                        background: color,
                      }}
                    />
                  ))}
                </div>
                <div
                  style={{
                    color: "#6b7680",
                    fontSize: 11,
                    letterSpacing: 2,
                  }}
                >
                  BUILD / SHIP / ITERATE
                </div>
              </div>
              <div style={{ display: "flex", flex: 1, gap: 12 }}>
                <div
                  style={{
                    flex: 1,
                    border: "1px solid #1e262e",
                    borderRadius: 4,
                    background: "#0a0e12",
                    display: "flex",
                    flexDirection: "column",
                    padding: 12,
                    justifyContent: "space-between",
                  }}
                >
                  <div
                    style={{
                      width: "72%",
                      height: 5,
                      borderRadius: 2,
                      background: "#2a343e",
                    }}
                  />
                  <div
                    style={{
                      width: "92%",
                      height: 46,
                      borderRadius: 3,
                      background: "#182029",
                    }}
                  />
                  <div
                    style={{
                      width: "48%",
                      height: 5,
                      borderRadius: 2,
                      background: "#00d9a3",
                    }}
                  />
                </div>
                <div
                  style={{
                    flex: 1,
                    border: "1px solid #1e262e",
                    borderRadius: 4,
                    background: "#0a0e12",
                    display: "flex",
                    flexDirection: "column",
                    padding: 12,
                    justifyContent: "space-between",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                    }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 99,
                        background: "#00d9a3",
                      }}
                    />
                    <div
                      style={{
                        width: "55%",
                        height: 5,
                        borderRadius: 2,
                        background: "#2a343e",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      width: "100%",
                      height: 2,
                      background: "#1e262e",
                    }}
                  />
                  <div
                    style={{
                      width: "70%",
                      height: 5,
                      borderRadius: 2,
                      background: "#2a343e",
                    }}
                  />
                </div>
              </div>
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
            <div>OYIBE CHIDUBEM</div>
            <div>oyibe.dev</div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
