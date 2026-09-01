export type CvSectionProps = {
  title: string;
  children: React.ReactNode;
};

/**
 * One titled block of the CV.
 *
 * The caller decides whether to render this at all — every section on the CV
 * is conditional on having data, and a heading with nothing under it is worse
 * than no heading.
 *
 * `break-inside-avoid` handles the browser's own print path. The PDF export
 * paginates from the DOM instead, and reads the `data-cv-block` markers below:
 * the heading is marked keep-with-next so it can never be stranded alone at the
 * foot of a page.
 */
export function CvSection({ title, children }: CvSectionProps) {
  return (
    <section className="mt-10 print:mt-8">
      <h2
        data-cv-block
        data-cv-keep-with-next
        className="label border-b border-border pb-2 text-muted"
      >
        {title}
      </h2>
      <div className="mt-6 flex flex-col gap-7 print:gap-5">{children}</div>
    </section>
  );
}
