import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/container";
import { Markdown } from "@/components/ui/markdown";
import { ReadingTime } from "@/components/ui/reading-time";
import { ArticleShareLinks } from "@/components/blog/article-share-links";
import { getBlogPostBySlug } from "@/lib/data";
import { pageMetadata } from "@/lib/seo";
import { getSiteIdentity } from "@/lib/site-identity";
import { siteConfig } from "@/data/site";

type BlogArticleProps = { params: Promise<{ slug: string }> };

function displayDate(value?: string): string {
  if (!value) return "Recently published";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

export async function generateMetadata({
  params,
}: BlogArticleProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) return { title: "Article not found" };

  return pageMetadata({
    title: post.title,
    description: post.excerpt,
    path: `/blog/${post.slug}`,
    image: "blog",
    imageUrl: post.cover.src,
    imageAlt: post.cover.alt,
    imageWidth: post.cover.width,
    imageHeight: post.cover.height,
    ogType: "article",
    publishedAt: post.publishedAt,
  });
}

export default async function BlogArticlePage({ params }: BlogArticleProps) {
  const { slug } = await params;
  const [post, identity] = await Promise.all([
    getBlogPostBySlug(slug),
    getSiteIdentity(),
  ]);
  if (!post) notFound();

  const articleUrl = `${siteConfig.url}/blog/${post.slug}`;
  const shareText = `${post.title}\nAn article by ${identity.name} on ${post.excerpt}\nRead more: ${articleUrl}`;
  const xShare = `https://twitter.com/intent/tweet?${new URLSearchParams({ text: shareText })}`;
  const facebookShare = `https://www.facebook.com/sharer/sharer.php?${new URLSearchParams({ u: articleUrl, quote: shareText })}`;
  const linkedInShare = `https://www.linkedin.com/sharing/share-offsite/?${new URLSearchParams({ url: articleUrl })}`;
  const networks = [
    { name: "X", icon: "x", href: xShare },
    { name: "Facebook", icon: "facebook", href: facebookShare },
    { name: "LinkedIn", icon: "linkedin", href: linkedInShare, copyFirst: true },
    { name: "DEV Community", icon: "devdotto", href: "https://dev.to/new", copyFirst: true },
    { name: "Substack", icon: "substack", href: "https://substack.com/notes", copyFirst: true },
  ];
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    mainEntityOfPage: { "@type": "WebPage", "@id": articleUrl },
    headline: post.title,
    description: post.excerpt,
    image: new URL(post.cover.src, siteConfig.url).toString(),
    ...(post.publishedAt ? { datePublished: post.publishedAt } : {}),
    author: { "@id": `${siteConfig.url}/#person` },
    publisher: { "@id": `${siteConfig.url}/#person` },
    isPartOf: { "@id": `${siteConfig.url}/#website` },
    inLanguage: "en",
  };

  return (
    <article className="pb-12 lg:pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleSchema).replace(/</g, "\\u003c"),
        }}
      />
      <section className="border-b border-border bg-surface/35">
        <Container className="py-10 lg:py-14">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-small text-muted transition-colors hover:text-link"
          >
            <span aria-hidden="true">&larr;</span> Blog archive
          </Link>

          <div className="mt-10 grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.62fr)] lg:gap-12">
            <header className="max-w-prose-page">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 label text-muted">
                <time dateTime={post.publishedAt}>{displayDate(post.publishedAt)}</time>
                <span aria-hidden="true" className="text-border-strong">/</span>
                <ReadingTime content={post.content} />
              </div>
              <h1 className="mt-6 text-balance">{post.title}</h1>
              <p className="mt-5 text-pretty text-body-lg text-muted">
                {post.excerpt}
              </p>
            </header>

            <figure className="max-w-md overflow-hidden rounded-lg border border-border bg-surface-raised lg:justify-self-end lg:w-full">
              <Image
                src={post.cover.src}
                alt={post.cover.alt}
                width={post.cover.width ?? 1349}
                height={post.cover.height ?? 632}
                sizes="(min-width: 1024px) 32vw, (min-width: 640px) 512px, 100vw"
                priority
                className="block h-auto w-full"
              />
            </figure>
          </div>
        </Container>
      </section>

      <Container className="py-10 lg:py-16">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-xl border border-border bg-surface shadow-lg shadow-black/10">
          <div className="border-b border-border px-6 py-3.5 sm:px-12 lg:px-16">
            <p className="label text-muted">
              <span className="text-accent">/</span> Article
            </p>
          </div>

          <div className="px-6 py-8 sm:px-12 sm:py-12 lg:px-16 lg:py-14">
            <div className="mx-auto max-w-3xl">
              <Markdown text={post.content} />
            </div>
          </div>

          <footer className="border-t border-border bg-background/40 px-6 py-5 sm:px-12 lg:px-16">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 text-small text-muted transition-colors hover:text-link"
              >
                <span aria-hidden="true">&larr;</span> Back to all articles
              </Link>
              <ArticleShareLinks shareText={shareText} networks={networks} />
            </div>
          </footer>
        </div>
      </Container>
    </article>
  );
}
