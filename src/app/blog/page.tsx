import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Container } from "@/components/layout/container";
import { getBlogPosts } from "@/lib/data";
import { pageMetadata } from "@/lib/seo";
import { getSiteIdentity } from "@/lib/site-identity";
import { estimateReadingTime } from "@/lib/blog";

export async function generateMetadata(): Promise<Metadata> {
  const identity = await getSiteIdentity();
  return pageMetadata({
    title: `Ideas worth building on. — ${identity.name}`,
    description: "Business, technology, and building useful digital products.",
    path: "/blog",
    image: "blog",
  });
}

function displayDate(value?: string): string {
  if (!value) return "Recently published";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

export default async function BlogPage() {
  const [posts, identity] = await Promise.all([getBlogPosts(), getSiteIdentity()]);
  const [latest, ...older] = posts;

  return (
    <Container className="py-16 lg:py-24">
      <header className="grid gap-8 border-b border-border pb-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
        <div>
          <p className="label text-muted">
            {identity.name.toUpperCase()} <span className="text-accent">/</span> BLOG
          </p>
          <h1 className="mt-4 text-balance">Ideas worth building on.</h1>
          <p className="mt-5 max-w-prose-page text-pretty text-body-lg text-muted">
            Business, technology, and building useful digital products.
          </p>
        </div>
        <p className="label text-muted lg:text-right">
          {String(posts.length).padStart(2, "0")} {posts.length === 1 ? "article" : "articles"}
        </p>
      </header>

      {latest ? (
        <section aria-labelledby="latest-writing" className="py-10 lg:py-14">
          <p className="label text-accent">Latest article</p>
          <article className="mt-5 grid overflow-hidden rounded-lg border border-border bg-surface lg:grid-cols-12">
            <Link
              href={`/blog/${latest.slug}`}
              className="group relative block overflow-hidden border-b border-border bg-surface-raised lg:col-span-7 lg:border-b-0 lg:border-r"
              aria-label={`Read ${latest.title}`}
            >
              <Image
                src={latest.cover.src}
                alt={latest.cover.alt}
                width={latest.cover.width ?? 1349}
                height={latest.cover.height ?? 632}
                sizes="(min-width: 1024px) 56vw, 100vw"
                priority
                className="block h-auto w-full transition-transform duration-500 ease-out group-hover:scale-105"
              />
            </Link>
            <div className="flex flex-col justify-center p-6 sm:p-8 lg:col-span-5 lg:p-10">
              <p className="label text-muted">
                {displayDate(latest.publishedAt)} <span aria-hidden="true">·</span> {estimateReadingTime(latest.content)}
              </p>
              <h2 id="latest-writing" className="mt-5 text-h3 text-balance">
                <Link
                  href={`/blog/${latest.slug}`}
                  className="transition-colors hover:text-link"
                >
                  {latest.title}
                </Link>
              </h2>
              <p className="mt-4 text-pretty text-muted">{latest.excerpt}</p>
              <Link
                href={`/blog/${latest.slug}`}
                className="mt-7 inline-flex w-fit items-center gap-2 text-small text-foreground transition-colors hover:text-link"
              >
                Read article <span aria-hidden="true">→</span>
              </Link>
            </div>
          </article>
        </section>
      ) : (
        <p className="py-16 text-muted">New articles will appear here soon.</p>
      )}

      {older.length > 0 ? (
        <section aria-labelledby="all-writing" className="border-t border-border pt-8">
          <div className="flex items-center justify-between gap-4">
            <h2 id="all-writing" className="text-h4">More articles</h2>
            <span className="label text-muted">{String(older.length).padStart(2, "0")} entries</span>
          </div>
          <div className="mt-5 divide-y divide-border">
            {older.map((post, index) => (
              <article key={post.id} className="grid gap-4 py-6 sm:grid-cols-[5rem_minmax(0,1fr)_auto] sm:items-center sm:gap-6">
                <span className="font-mono text-small text-accent">{String(index + 2).padStart(2, "0")}</span>
                <div>
                  <p className="label text-muted">
                    {displayDate(post.publishedAt)} <span aria-hidden="true">·</span> {estimateReadingTime(post.content)}
                  </p>
                  <h3 className="mt-2 text-h5">
                    <Link href={`/blog/${post.slug}`} className="transition-colors hover:text-link">
                      {post.title}
                    </Link>
                  </h3>
                  <p className="mt-2 max-w-prose-page text-small text-muted">{post.excerpt}</p>
                </div>
                <Link
                  href={`/blog/${post.slug}`}
                  className="inline-flex items-center gap-2 text-small text-muted transition-colors hover:text-link"
                >
                  Read <span aria-hidden="true">→</span>
                </Link>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </Container>
  );
}
