import type { Metadata } from "next";

import { AdminPageHeader } from "@/components/admin/chrome";
import { isCloudinaryConfigured } from "@/lib/cloudinary";

import { BlogForm } from "../blog-form";

export const metadata: Metadata = { title: "New article" };

export default function NewBlogPostPage() {
  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        backHref="/admin/blog"
        backLabel="Blog"
        title="New article"
        description="Save as a draft or publish it to the public site."
      />
      <BlogForm cloudinaryConfigured={isCloudinaryConfigured()} />
    </div>
  );
}
