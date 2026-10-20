import type { Metadata } from "next";
import Link from "next/link";

import { AdminPageHeader, Chip, EmptyState, Panel, buttonGhost, buttonPrimary } from "@/components/admin/chrome";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { formatStamp } from "@/lib/admin/format";
import { prisma } from "@/lib/prisma";

import { deleteBlogPost } from "./actions";

export const metadata: Metadata = { title: "Blog" };

export default async function AdminBlogPage() {
  const rows = await prisma.blogPost.findMany({
    orderBy: [{ updatedAt: "desc" }, { title: "asc" }],
  });

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Blog"
        description="Write articles, manage their cover images, and control what is published."
        actions={<Link href="/admin/blog/new" className={buttonPrimary}><span aria-hidden="true">+</span> New article</Link>}
      />

      {rows.length === 0 ? (
        <EmptyState
          title="No articles yet"
          description="Create an article here. Drafts stay private until you publish them."
          action={<Link href="/admin/blog/new" className={buttonPrimary}>Write the first article</Link>}
        />
      ) : (
        <Panel title={`${rows.length} ${rows.length === 1 ? "article" : "articles"}`} flush>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem] border-collapse text-small">
              <thead>
                <tr className="border-b border-border text-left">
                  <Th>Article</Th><Th>Status</Th><Th>Published</Th><Th>Updated</Th><Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-border/60 last:border-0 hover:bg-surface/60">
                    <Td>
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={row.coverSrc} alt="" className="size-10 shrink-0 rounded border border-border object-cover" />
                        <span className="min-w-0">
                          <Link href={`/admin/blog/${row.id}`} className="block truncate font-medium text-foreground hover:text-link">{row.title}</Link>
                          <span className="block truncate font-mono text-label text-muted">/blog/{row.slug}</span>
                        </span>
                      </div>
                    </Td>
                    <Td><Chip tone={row.published ? "accent" : "neutral"}>{row.published ? "Published" : "Draft"}</Chip></Td>
                    <Td className="whitespace-nowrap text-muted">{row.publishedAt ? formatStamp(row.publishedAt) : "—"}</Td>
                    <Td className="whitespace-nowrap text-muted" title={row.updatedAt.toISOString()}>{formatStamp(row.updatedAt)}</Td>
                    <Td className="text-right">
                      <span className="inline-flex items-center justify-end gap-1.5">
                        <Link href={`/admin/blog/${row.id}`} className={`${buttonGhost} h-8`}>Edit</Link>
                        <ConfirmDelete
                          title="Delete article"
                          description={<><strong className="text-foreground">{row.title}</strong> will be permanently removed and disappear from the public site.</>}
                          confirmLabel="Delete article"
                          action={deleteBlogPost.bind(null, row.id)}
                          triggerIconOnly
                          triggerLabel={`Delete ${row.title}`}
                        />
                      </span>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    </div>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th scope="col" className={`label px-4 py-2.5 font-medium text-muted ${className ?? ""}`}>{children}</th>;
}

function Td({ children, className, title }: { children: React.ReactNode; className?: string; title?: string }) {
  return <td title={title} className={`px-4 py-3 ${className ?? ""}`}>{children}</td>;
}
