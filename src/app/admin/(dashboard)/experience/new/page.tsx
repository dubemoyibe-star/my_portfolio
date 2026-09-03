import type { Metadata } from "next";

import { AdminPageHeader } from "@/components/admin/chrome";
import { emptyExperience } from "@/lib/admin/experience-input";
import { readTechOptions } from "@/lib/admin/tech-options";

import { ExperienceForm } from "../experience-form";

/**
 * The create screen.
 *
 * Thin on purpose: it resolves the one thing the form cannot fetch for itself
 * — the tech vocabulary — and hands over. All the behaviour lives in
 * `ExperienceForm`, which the edit screen renders too.
 *
 * No Cloudinary check, unlike the project equivalent. A role carries no
 * images.
 */

export const metadata: Metadata = {
  title: "New role",
};

export default async function NewExperiencePage() {
  const techOptions = await readTechOptions();

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        backHref="/admin/experience"
        backLabel="Experience"
        title="New role"
        description="Company, title and a start date are enough. Nothing is written until you press create."
      />

      <ExperienceForm
        mode="create"
        initial={emptyExperience()}
        techOptions={techOptions}
      />
    </div>
  );
}
