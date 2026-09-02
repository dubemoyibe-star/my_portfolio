import { siteConfig } from "@/data/site";
import {
  getContributions,
  getProfile,
  getProjects,
  getTechStack,
} from "@/lib/data";
import { groupTech } from "@/lib/tech-groups";
import type { Contribution, Project } from "@/types";

/**
 * `/llms.txt` — the site's content as plain Markdown, for language models.
 *
 * Crawlers that render JavaScript see this site fine; most model-facing
 * fetchers do not. They pull the HTML, get an app shell, and either invent the
 * details or report that the page is empty. This route is the same content in
 * the form those clients can actually read, following the convention at
 * llmstxt.org: an H1, a one-paragraph summary, then flat `##` sections of
 * bullets.
 *
 * ## Generated, never authored
 *
 * Every value here is read through `@/lib/data`, the same access layer the
 * pages use — so a project added or a summary rewritten in the admin panel
 * shows up here on the next revalidation with nothing to remember. A static
 * `public/llms.txt` would have been half a day's work and permanently wrong
 * thereafter, which is worse than not having the file: a stale answer reads as
 * confidently as a current one.
 *
 * The one thing this file owns is the *shape* — which fields make the cut and
 * how a line is punctuated. Fields are `|`-delimited rather than woven into
 * prose so a parser can split a bullet without guessing where a summary's own
 * punctuation ends, and so a summary that does not end in a period still reads
 * correctly.
 *
 * ## Why `force-static`
 *
 * Route handlers are uncached by default, which would put a database round
 * trip on every fetch of a document that changes a few times a year. Prerendered,
 * it is served from the full route cache and refreshed by
 * `revalidatePublicContent()` — the same mechanism, and the same build-time
 * database dependency, that every prerendered page here already has.
 */

export const dynamic = "force-static";

/**
 * Collapse whitespace to a single line.
 *
 * Summaries are single-line today, but they are free text in an admin
 * textarea. One stray newline in `summary` would break a bullet in half and
 * turn the remainder into a stray paragraph between list items.
 */
function oneLine(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

/** Join the parts of a bullet, dropping the ones this record does not have. */
function fields(...parts: (string | undefined)[]): string {
  return parts.filter(Boolean).join(" | ");
}

/** `- **Stenion** — Summary. | Live: … | Repo: …` */
function projectLine(project: Project): string {
  const { live, repo } = project.links;
  return `- **${project.title}** — ${fields(
    oneLine(project.summary),
    live && `Live: ${live}`,
    repo && `Repo: ${repo}`,
  )}`;
}

/**
 * `- **Atreus** (atreus-lab) — Summary. | Repo: … | PR #84 — …: …`
 *
 * The summary is `contributionSummary`, not `repoDescription`: what this
 * person did is the fact a model is being asked about, and the repo's own
 * description is one click away at the URL on the same line.
 */
function contributionLine(entry: Contribution): string {
  /* The owner is dropped when it only restates the repo name — several of
     these repos are owned by an org of the same name, and
     "Stellar-IndigoPay (Stellar-IndigoPay)" is a line that makes a reader
     check whether they misread it. Compared loosely because the two spellings
     differ by separators and case more often than they differ in substance. */
  const loose = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
  const name =
    entry.owner && loose(entry.owner) !== loose(entry.repoName)
      ? `${entry.repoName} (${entry.owner})`
      : entry.repoName;

  return `- **${name}** — ${fields(
    oneLine(entry.contributionSummary),
    `Repo: ${entry.repoUrl}`,
    ...entry.prLinks.map((pr) => `${oneLine(pr.label)}: ${pr.url}`),
  )}`;
}

/**
 * A heading and its bullets, or nothing at all.
 *
 * Sections disappear when empty rather than standing as a heading over blank
 * space — the same rule the page sections follow by returning `null`. An empty
 * "Projects" heading reads as "this person has no projects", which is a worse
 * answer than silence.
 */
function section(heading: string, lines: string[]): string[] {
  return lines.length === 0 ? [] : [`## ${heading}`, "", ...lines, ""];
}

export async function GET(): Promise<Response> {
  const [profile, projects, contributions, tech] = await Promise.all([
    getProfile(),
    getProjects(),
    getContributions(),
    getTechStack({ featured: true }),
  ]);

  /* `resume.summary` rather than `bio.short`: both are the real profile bio,
     but the resume register is third person and already states the fullstack /
     blockchain / Web3 shape of the work in one paragraph. The site's first
     person voice ("I like solving real problems") is written for a reader
     browsing a page, and reads as noise once it is quoted back as fact. */
  const summary = oneLine(profile.resume.summary);

  /* The two facts the summary leaves out and a model is regularly asked for.
     Both are optional in the schema, so the line assembles from whatever is
     set and is skipped entirely when neither is. */
  const facts = [
    profile.location && `Based in ${profile.location}.`,
    profile.availableForWork ? "Available for work." : undefined,
  ]
    .filter(Boolean)
    .join(" ");

  const lines = [
    `# ${profile.name}`,
    "",
    `> ${summary}`,
    "",
    ...(facts ? [facts, ""] : []),

    ...section("Projects", projects.map(projectLine)),

    ...section(
      "Open Source Contributions",
      contributions.map(contributionLine),
    ),

    /* Grouped through `groupTech`, so this agrees with the stack section and
       the CV about which categories exist rather than inventing a third
       grouping. Names only — icons, proficiency and years are display detail
       with nothing to say to a reader asking what someone works in. */
    ...section(
      "Tech Stack",
      groupTech(tech).map(
        (group) =>
          `- ${group.label}: ${group.items.map((item) => item.name).join(", ")}`,
      ),
    ),

    ...section("Links", [
      `- Portfolio: ${siteConfig.url}`,
      ...profile.links.map((link) => `- ${link.label}: ${link.href}`),
      `- CV: ${siteConfig.url}/cv`,
      `- Email: ${profile.email}`,
    ]),
  ];

  return new Response(lines.join("\n"), {
    headers: {
      /* Not `text/markdown`: this is fetched as often by a browser as by a
         client that knows the convention, and every browser offers to download
         a markdown response instead of showing it. The convention names the
         file `.txt` for the same reason. */
      "content-type": "text/plain; charset=utf-8",
    },
  });
}
