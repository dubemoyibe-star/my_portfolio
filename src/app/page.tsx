import { HashLanding } from "@/components/layout/hash-landing";
import { Contributions } from "@/components/sections/contributions";
import { Education } from "@/components/sections/education";
import { Experience } from "@/components/sections/experience";
import { Hero } from "@/components/sections/hero";
import { Projects } from "@/components/sections/projects";
import { TechStack } from "@/components/sections/tech-stack";

/**
 * Home page.
 *
 * Sections are self-gating: each returns `null` when its data is empty, so the
 * page composes them unconditionally and never renders a bare heading.
 *
 * Order puts the work first, then the supporting evidence for it: the stack,
 * then background. Neither is an opening argument.
 */
export default function HomePage() {
  return (
    <>
      <HashLanding />
      <Hero />
      <Experience />
      <Projects />
      <Contributions />
      <TechStack />
      <Education />
    </>
  );
}
