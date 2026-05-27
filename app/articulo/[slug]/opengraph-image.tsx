import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/config/site";

export const runtime = "edge";
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await prisma.article.findUnique({
    where: { slug },
    select: { title: true, summary: true, category: { select: { name: true } } },
  });

  if (!article) {
    return new ImageResponse(
      <FailedOG />,
      { width: 1200, height: 630 }
    );
  }

  return new ImageResponse(
    <ArticleOG
      title={article.title}
      summary={article.summary || ""}
      category={article.category?.name || ""}
    />,
    {
      width: 1200,
      height: 630,
    }
  );
}

function ArticleOG({ title, summary, category }: { title: string; summary: string; category: string }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)",
        padding: "80px",
        fontFamily: "Geist, sans-serif",
        color: "white",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            fontSize: "18px",
            fontWeight: "700",
            color: "#38bdf8",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          {category}
        </div>
        <div style={{ width: 1, height: 20, background: "#475569" }} />
        <div style={{ fontSize: "18px", color: "#94a3b8" }}>
          {siteConfig.name}
        </div>
      </div>
      <h1
        style={{
          fontSize: "64px",
          fontWeight: "900",
          lineHeight: "1.1",
          marginBottom: "24px",
          maxWidth: "1040px",
        }}
      >
        {title}
      </h1>
      <p
        style={{
          fontSize: "24px",
          color: "#cbd5e1",
          maxWidth: "800px",
          lineHeight: "1.4",
        }}
      >
        {summary.length > 150 ? summary.slice(0, 147) + "..." : summary}
      </p>
      <div
        style={{
          position: "absolute",
          top: "80px",
          right: "80px",
          fontSize: "48px",
          fontWeight: "900",
          color: "#38bdf8",
          opacity: 0.15,
        }}
      >
        EMEDOTEME
      </div>
    </div>
  );
}

function FailedOG() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#0f172a",
        color: "white",
        fontFamily: "Geist, sans-serif",
      }}
    >
      <div style={{ fontSize: "80px", fontWeight: "900", marginBottom: "16px" }}>
        {siteConfig.name}
      </div>
      <div style={{ fontSize: "28px", color: "#94a3b8" }}>
        {siteConfig.description}
      </div>
    </div>
  );
}
