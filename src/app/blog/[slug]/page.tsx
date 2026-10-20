import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/container";
import { Markdown } from "@/components/ui/markdown";
import { ReadingTime } from "@/components/ui/reading-time";
import { getBlogPostBySlug } from "@/lib/data";
import { pageMetadata } from "@/lib/seo";

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
  });
}

export default async function BlogArticlePage({ params }: BlogArticleProps) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) notFound();

  return (
    <article className="pb-12 lg:pb-20">
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
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-small text-muted transition-colors hover:text-link"
            >
              <span aria-hidden="true">&larr;</span> Back to all articles
            </Link>
          </footer>
        </div>
      </Container>
    </article>
  );
}
