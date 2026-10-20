import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/container";
import { Markdown } from "@/components/ui/markdown";
import { estimateReadingTime } from "@/lib/blog";
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
    <article>
      <Container className="py-12 lg:py-20">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-small text-muted transition-colors hover:text-link"
        >
          <span aria-hidden="true">←</span> All writing
        </Link>

        <header className="mt-12 max-w-prose-page">
          <p className="label text-muted">
            {displayDate(post.publishedAt)} <span aria-hidden="true">·</span> {estimateReadingTime(post.content)}
          </p>
          <h1 className="mt-5 text-balance">{post.title}</h1>
          <p className="mt-6 text-pretty text-body-lg text-muted">
            {post.excerpt}
          </p>
        </header>

        <figure className="mt-8 max-w-lg overflow-hidden rounded-lg border border-border bg-surface-raised">
          <Image
            src={post.cover.src}
            alt={post.cover.alt}
            width={post.cover.width ?? 1349}
            height={post.cover.height ?? 632}
            sizes="(min-width: 1152px) 512px, 100vw"
            priority
            className="block h-auto w-full"
          />
        </figure>

        <div className="mt-12 max-w-prose-page">
          <Markdown text={post.content} />
        </div>

        <footer className="mt-14 max-w-prose-page border-t border-border pt-6">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-small text-muted transition-colors hover:text-link"
          >
            <span aria-hidden="true">←</span> More writing
          </Link>
        </footer>
      </Container>
    </article>
  );
}
