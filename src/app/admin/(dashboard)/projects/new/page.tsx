import type { Metadata } from "next";

import { AdminPageHeader } from "@/components/admin/chrome";
import { emptyProject } from "@/lib/admin/project-input";
import { isCloudinaryConfigured } from "@/lib/cloudinary";

import { ProjectForm } from "../project-form";
import { readTechOptions } from "../tech-options";

/**
 * The create screen.
 *
 * Thin on purpose: it resolves the two things the form cannot fetch for itself
 * — the tech vocabulary and whether uploads are wired up — and hands over. All
 * the behaviour lives in `ProjectForm`, which the edit screen renders too.
 *
 * `isCloudinaryConfigured()` is read here rather than inside the uploader
 * because the answer is in `process.env`, which the browser has no access to.
 * Passing it down means the drop zone can say "Cloudinary is not configured"
 * up front instead of failing on the first drop.
 */

export const metadata: Metadata = {
  title: "New project",
};

export default async function NewProjectPage() {
  const techOptions = await readTechOptions();

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        backHref="/admin/projects"
        backLabel="Projects"
        title="New project"
        description="Nothing is written until you press create."
      />

      <ProjectForm
        mode="create"
        initial={emptyProject()}
        techOptions={techOptions}
        cloudinaryConfigured={isCloudinaryConfigured()}
      />
    </div>
  );
}
