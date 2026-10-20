import type { BlogPost } from "@/types";

/** Temporary launch content. Add real writing through /admin/blog when ready. */
export const blogPosts: BlogPost[] = [
  {
    id: "starter-writing-in-public",
    slug: "building-in-public-without-the-noise",
    title: "Building in public without adding noise",
    excerpt:
      "A practical way to share the decisions behind a project while the work is still taking shape.",
    content: `A build log does not need to be a stream of screenshots and status updates. The useful part is the thinking: what changed, what surprised you, and what you would do differently next time.\n\nFor me, writing in public works best when it follows the work. I keep short notes as I make decisions, then turn the ones with a clear lesson into something another builder can use.\n\nThat keeps the writing honest. It also makes a portfolio more than a list of finished interfaces: it gives people a window into how the work got there.`,
    cover: {
      src: "/stenion-cover.png",
      alt: "Stenion risk intelligence dashboard landing page",
      width: 1349,
      height: 632,
    },
    published: true,
    publishedAt: "2026-10-20",
  },
  {
    id: "starter-small-details",
    slug: "the-small-details-that-make-a-product-feel-finished",
    title: "The small details that make a product feel finished",
    excerpt:
      "Polish is rarely one dramatic effect. It is a string of small decisions that make a screen easier to understand and use.",
    content: `A clear empty state, a button that says what happens next, and an image that keeps its real proportions all do quiet work. None of them is a headline feature, but each removes a moment of friction.\n\nI try to review interfaces in passes: first the hierarchy, then the words, then the responsive behavior, and finally the details like focus, loading, and empty states. This makes polish concrete instead of a vague request to “make it nicer.”\n\nThe best finishing touches usually make the interface feel simpler, because they remove things the user should not have to think about.`,
    cover: {
      src: "/dsuite-cover.png",
      alt: "A product interface designed around clear hierarchy",
      width: 1349,
      height: 632,
    },
    published: true,
    publishedAt: "2026-10-12",
  },
  {
    id: "starter-project-notes",
    slug: "what-i-write-down-before-i-build",
    title: "What I write down before I build",
    excerpt:
      "A short project brief can save hours of polishing the wrong thing. Here is the set of questions I use to get started.",
    content: `Before opening a design file or editor, I write down who the product is for, what they need to do, and what success would look like. If those answers are fuzzy, the interface will be fuzzy too.\n\nThen I list the constraints: data we already have, the smallest useful first version, and the parts that can wait. That keeps scope visible and gives technical choices a real context.\n\nIt is not a heavyweight process. A page of notes is enough to make the first implementation more deliberate and the later trade-offs easier to explain.`,
    cover: {
      src: "/bookshell-cover.png",
      alt: "A project interface used as a visual planning reference",
      width: 1349,
      height: 632,
    },
    published: true,
    publishedAt: "2026-10-03",
  },
];
