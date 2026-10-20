import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/chrome";
import { isCloudinaryConfigured } from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";

import { BlogForm } from "../blog-form";

type EditBlogPageProps = { params: Promise<{ id: string }> };

export const metadata: Metadata = { title: "Edit article" };

export default async function EditBlogPostPage({ params }: EditBlogPageProps) {
  const { id } = await params;
  const row = await prisma.blogPost.findUnique({ where: { id } });
  if (!row) notFound();

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        backHref="/admin/blog"
        backLabel="Blog"
        title="Edit article"
        description={row.title}
      />
      <BlogForm
        cloudinaryConfigured={isCloudinaryConfigured()}
        initial={{
          id: row.id,
          slug: row.slug,
          title: row.title,
          excerpt: row.excerpt,
          content: row.content,
          coverSrc: row.coverSrc,
          coverAlt: row.coverAlt,
          coverWidth: row.coverWidth,
          coverHeight: row.coverHeight,
          published: row.published,
          publishedAt: row.publishedAt?.toISOString() ?? null,
        }}
      />
    </div>
  );
}
