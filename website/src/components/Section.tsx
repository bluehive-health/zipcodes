import type { ReactNode } from 'react';

interface SectionProps {
    id: string;
    title: string;
    intro?: string;
    children: ReactNode;
}

/** A page section with a linkable heading. */
export function Section({ id, title, intro, children }: SectionProps) {
    return (
        <section id={id} aria-labelledby={`${id}-title`} className="border-border border-b">
            <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
                <h2 id={`${id}-title`} className="text-foreground text-3xl font-extrabold tracking-tight sm:text-4xl">
                    {title}
                </h2>
                {intro ? <p className="text-muted-foreground mt-3 max-w-3xl text-lg text-pretty">{intro}</p> : null}
                <div className="mt-8">{children}</div>
            </div>
        </section>
    );
}
