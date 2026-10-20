"use server";

import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/admin-session";
import { discardUnusedUploads } from "@/lib/admin/asset-cleanup";
import { revalidatePublicContent } from "@/lib/admin/revalidate";
import { isImageSrc, isSlug, nullableInt, slugify, text } from "@/lib/admin/validation";
import type { ActionResult } from "@/lib/admin/validation";
import { prisma } from "@/lib/prisma";

function supportedCoverSource(value: string): boolean {
  if (!isImageSrc(value)) return false;
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "res.cloudinary.com";
  } catch {
    return false;
  }
}

export async function saveBlogPost(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = text(formData.get("id"));
  const title = text(formData.get("title"));
  const slug = slugify(text(formData.get("slug")) || title);
  const excerpt = text(formData.get("excerpt"));
  const content = text(formData.get("content"));
  const coverSrc = text(formData.get("coverSrc"));
  const coverAlt = text(formData.get("coverAlt"));
  const published = formData.get("published") === "on";
  const dateValue = text(formData.get("publishedAt"));

  if (!title || !isSlug(slug) || !excerpt || !content || !coverAlt || !supportedCoverSource(coverSrc)) {
    throw new Error("Complete the required article fields with a valid image URL.");
  }

  const publishedAt = published
    ? dateValue
      ? new Date(`${dateValue}T00:00:00.000Z`)
      : new Date()
    : null;
  if (publishedAt && Number.isNaN(publishedAt.getTime())) {
    throw new Error("Enter a valid publication date.");
  }
  const coverWidth = nullableInt(formData.get("coverWidth"));
  const coverHeight = nullableInt(formData.get("coverHeight"));
  if ((coverWidth !== null && coverWidth < 1) || (coverHeight !== null && coverHeight < 1)) {
    throw new Error("Image dimensions must be positive numbers.");
  }
  const values = {
    slug,
    title,
    excerpt,
    content,
    coverSrc,
    coverAlt,
    coverWidth,
    coverHeight,
    published,
    publishedAt,
  };

  const existing = id
    ? await prisma.blogPost.findUnique({
        where: { id },
        select: { coverSrc: true },
      })
    : null;

  try {
    if (id) {
      await prisma.blogPost.update({ where: { id }, data: values });
    } else {
      await prisma.blogPost.create({ data: values });
    }
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new Error("That URL slug is already in use. Choose another one.");
    }
    throw error;
  }

  if (existing && existing.coverSrc !== coverSrc) {
    await discardUnusedUploads([existing.coverSrc]);
  }

  revalidatePublicContent();
  redirect("/admin/blog");
}

export async function deleteBlogPost(id: string): Promise<ActionResult> {
  await requireAdmin();
  const existing = await prisma.blogPost.findUnique({
    where: { id },
    select: { coverSrc: true },
  });
  await prisma.blogPost.delete({ where: { id } });
  if (existing) await discardUnusedUploads([existing.coverSrc]);
  revalidatePublicContent();
  return { ok: true };
}
