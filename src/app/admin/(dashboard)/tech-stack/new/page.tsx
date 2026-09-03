import type { Metadata } from "next";

import { AdminPageHeader } from "@/components/admin/chrome";
import { emptyTech } from "@/lib/admin/tech-input";

import { TechForm } from "../tech-form";

/**
 * The create screen.
 *
 * Thinner than the project and contribution equivalents, which resolve a tech
 * vocabulary and a ranking before handing over. A tech item references nothing
 * and is not ranked, so there is nothing to fetch — the form is the whole
 * screen.
 */

export const metadata: Metadata = {
  title: "New tech item",
};

export default function NewTechPage() {
  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        backHref="/admin/tech-stack"
        backLabel="Tech stack"
        title="New tech item"
        description="Nothing is written until you press create. The id is the one field chosen here for good — projects and experience reference it, so it cannot be edited afterwards."
      />

      <TechForm mode="create" initial={emptyTech()} />
    </div>
  );
}
