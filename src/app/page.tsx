import { Contributions } from "@/components/sections/contributions";
import { Hero } from "@/components/sections/hero";
import { Projects } from "@/components/sections/projects";
import { TechStack } from "@/components/sections/tech-stack";

/**
 * Home page.
 *
 * Sections are self-gating: each returns `null` when its data is empty, so the
 * page composes them unconditionally and never renders a bare heading.
 *
 * Order puts the work first and the stack last — the stack is supporting
 * evidence for the projects above it, not an opening argument.
 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <Projects />
      <Contributions />
      <TechStack />
    </>
  );
}
