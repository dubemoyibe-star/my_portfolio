import path from "node:path";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

import { blogPosts } from "../src/data/blog";

try {
  process.loadEnvFile(path.join(process.cwd(), ".env.local"));
} catch {
  /* The deploy environment may supply DIRECT_URL directly. */
}

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DIRECT_URL is not set. Copy .env.example to .env.local and fill it in.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  const result = await prisma.blogPost.createMany({
    data: blogPosts.map((post) => ({
      id: post.id,
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      coverSrc: post.cover.src,
      coverAlt: post.cover.alt,
      coverWidth: post.cover.width,
      coverHeight: post.cover.height,
      published: post.published,
      publishedAt: post.publishedAt ? new Date(post.publishedAt) : null,
    })),
    skipDuplicates: true,
  });
  console.log(`Inserted ${result.count} starter blog posts; existing posts were left untouched.`);
}

main()
  .catch((error) => {
    console.error("Blog seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
