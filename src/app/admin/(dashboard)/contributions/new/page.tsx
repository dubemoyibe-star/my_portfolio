import type { Metadata } from "next";

import { AdminPageHeader } from "@/components/admin/chrome";
import { emptyContribution } from "@/lib/admin/contribution-input";

import { ContributionForm } from "../contribution-form";
import { readContributionRanking } from "../ranking";

/**
 * The create screen. Thin, as with projects: it resolves the one thing the form
 * cannot fetch for itself — the current ranking, so a chosen `order` is picked
 * against something rather than guessed — and hands over.
 */

export const metadata: Metadata = {
  title: "New contribution",
};

export default async function NewContributionPage() {
  const ranking = await readContributionRanking();

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        backHref="/admin/contributions"
        backLabel="Contributions"
        title="New contribution"
        description="Nothing is written until you press create. Leave the order empty and it sorts last, then move it into place with the arrows on the list."
      />

      <ContributionForm
        mode="create"
        initial={emptyContribution()}
        ranking={ranking}
      />
    </div>
  );
}
