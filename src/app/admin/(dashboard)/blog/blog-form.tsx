"use client";

import { useState } from "react";

import { Field, TextArea, TextInput } from "@/components/admin/fields";
import { Panel, buttonPrimary } from "@/components/admin/chrome";
import { UploadDropzone, type UploadedImage } from "@/components/admin/image-upload";
import { saveBlogPost } from "./actions";

export type BlogFormValues = {
  id?: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverSrc: string;
  coverAlt: string;
  coverWidth?: number | null;
  coverHeight?: number | null;
  published: boolean;
  publishedAt?: string | null;
};

export function BlogForm({
  initial,
  cloudinaryConfigured,
}: {
  initial?: BlogFormValues;
  cloudinaryConfigured: boolean;
}) {
  const [coverSrc, setCoverSrc] = useState(initial?.coverSrc ?? "");
  const [coverAlt, setCoverAlt] = useState(initial?.coverAlt ?? "");
  const [coverWidth, setCoverWidth] = useState(initial?.coverWidth ?? "");
  const [coverHeight, setCoverHeight] = useState(initial?.coverHeight ?? "");

  function imageUploaded(images: UploadedImage[]) {
    const image = images[0];
    if (!image) return;
    setCoverSrc(image.src);
    setCoverWidth(image.width ?? "");
    setCoverHeight(image.height ?? "");
  }

  return (
    <form action={saveBlogPost} className="flex flex-col gap-5">
      {initial?.id ? <input type="hidden" name="id" value={initial.id} /> : null}

      <Panel title="Article">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title" htmlFor="title" required className="sm:col-span-2">
            <TextInput id="title" name="title" required defaultValue={initial?.title ?? ""} />
          </Field>
          <Field
            label="URL slug"
            htmlFor="slug"
            hint="Leave blank to make it from the title."
            className="sm:col-span-2"
          >
            <TextInput id="slug" name="slug" mono defaultValue={initial?.slug ?? ""} />
          </Field>
          <Field label="Short description" htmlFor="excerpt" required className="sm:col-span-2">
            <TextArea id="excerpt" name="excerpt" rows={3} required defaultValue={initial?.excerpt ?? ""} />
          </Field>
          <Field
            label="Article text"
            htmlFor="content"
            hint="Markdown supported: headings, links, lists, quotes, code and tables."
            required
            className="sm:col-span-2"
          >
            <TextArea id="content" name="content" rows={16} required defaultValue={initial?.content ?? ""} />
          </Field>
        </div>
      </Panel>

      <Panel title="Cover image" description="This image is used on the article page and as its Open Graph image.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <UploadDropzone
              kind="blog"
              onUploaded={imageUploaded}
              configured={cloudinaryConfigured}
              label="Drop the article cover here, or"
            />
          </div>
          <Field label="Image URL" htmlFor="coverSrc" required className="sm:col-span-2">
            <TextInput
              id="coverSrc"
              name="coverSrc"
              type="text"
              required
              placeholder="https://... or /image.png"
              value={coverSrc}
              onChange={(event) => setCoverSrc(event.target.value)}
            />
          </Field>
          <Field label="Image description" htmlFor="coverAlt" required className="sm:col-span-2">
            <TextInput id="coverAlt" name="coverAlt" required value={coverAlt} onChange={(event) => setCoverAlt(event.target.value)} />
          </Field>
          <Field label="Image width" htmlFor="coverWidth" hint="Optional intrinsic dimensions.">
            <TextInput id="coverWidth" name="coverWidth" type="number" min="1" value={coverWidth} onChange={(event) => setCoverWidth(event.target.value)} />
          </Field>
          <Field label="Image height" htmlFor="coverHeight" hint="Optional intrinsic dimensions.">
            <TextInput id="coverHeight" name="coverHeight" type="number" min="1" value={coverHeight} onChange={(event) => setCoverHeight(event.target.value)} />
          </Field>
        </div>
      </Panel>

      <Panel title="Publishing">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Publication date" htmlFor="publishedAt" hint="Blank uses today when published.">
            <TextInput
              id="publishedAt"
              name="publishedAt"
              type="date"
              defaultValue={initial?.publishedAt?.slice(0, 10) ?? ""}
            />
          </Field>
          <label className="flex items-center gap-3 self-end rounded-md border border-border px-3 py-2.5 text-small">
            <input
              type="checkbox"
              name="published"
              defaultChecked={initial?.published ?? false}
              className="size-4 accent-[var(--accent)]"
            />
            <span>
              <span className="block text-foreground">Published</span>
              <span className="block text-muted">Visible on the public site</span>
            </span>
          </label>
        </div>
      </Panel>

      <div className="flex justify-end">
        <button type="submit" className={buttonPrimary}>
          {initial?.id ? "Save article" : "Create article"}
        </button>
      </div>
    </form>
  );
}
