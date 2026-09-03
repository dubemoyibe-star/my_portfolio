import type { Metadata } from "next";

import { AdminPageHeader, Panel } from "@/components/admin/chrome";
import { emptyEducation } from "@/lib/admin/education-input";

import { EducationForm } from "../education-form";

/**
 * A second education entry — a master's, another institution.
 *
 * The existing entries are edited in place on `/admin/education`, so this
 * route exists only because a blank form has to come from somewhere. See the
 * note at the top of `../education-form`.
 *
 * `/admin/education/new` and `/admin/education/certifications` are siblings,
 * and Next resolves static segments in order, so neither can shadow the other.
 */

export const metadata: Metadata = {
  title: "New education entry",
};

export default function NewEducationPage() {
  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        backHref="/admin/education"
        backLabel="Education"
        title="New education entry"
        description="Nothing is written until you press create."
      />

      <Panel title="The entry" description="Institution, field, status, dates.">
        <EducationForm mode="create" initial={emptyEducation()} />
      </Panel>
    </div>
  );
}
