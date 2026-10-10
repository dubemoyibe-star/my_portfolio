export type CvSectionProps = {
  title: string;
  children: React.ReactNode;
};

/** One titled block of the CV. */
export function CvSection({ title, children }: CvSectionProps) {
  return (
    <section className="mt-10 print:mt-8">
      <h2 className="label border-b border-border pb-2 text-muted">
        {title}
      </h2>
      <div className="mt-6 flex flex-col gap-7 print:gap-5">{children}</div>
    </section>
  );
}
