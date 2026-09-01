import { Hero } from "@/components/sections/hero";
import { TechStack } from "@/components/sections/tech-stack";

/**
 * Home page.
 *
 * Sections are self-gating: each returns `null` when its data is empty, so the
 * page composes them unconditionally and never renders a bare heading.
 *
 * Projects, contributions and experience land here in the next passes.
 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <TechStack />
    </>
  );
}
