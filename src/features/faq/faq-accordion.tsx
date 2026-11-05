import { useEffect, useMemo, useRef, useState } from 'react';
import { questionAnchor, searchFaq, type FaqCategory, type FaqQuestion } from './faq';

export interface FaqAccordionLabels {
  searchLabel: string;
  searchPlaceholder: string;
  searchClear: string;
  noResults: string;
  emptyTitle: string;
  emptyBody: string;
  resultsOne: string;
  resultsMany: string;
  copyLink: string;
  copied: string;
}

interface FaqAccordionProps {
  questions: FaqQuestion[];
  categories: FaqCategory[];
  labels: FaqAccordionLabels;
}

const inputClass =
  'w-full rounded-sm border border-rule bg-paper px-3 py-2 text-sm text-ink placeholder:text-mute transition-colors duration-500 ease-fluid focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

export function findQuestionByAnchor(hash: string, questions: FaqQuestion[]): FaqQuestion | null {
  const id = decodeURIComponent(hash.replace(/^#/, ''));
  if (!id) return null;
  return questions.find((question) => questionAnchor(question) === id) ?? null;
}

export function FaqAccordion({ questions, categories, labels }: FaqAccordionProps) {
  const [query, setQuery] = useState('');
  const [copiedAnchor, setCopiedAnchor] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const applyHash = () => {
    const target = findQuestionByAnchor(window.location.hash, questions);
    if (!target) return;
    const anchor = questionAnchor(target);
    // Open natively instead of driving `open` as a controlled prop: React and
    // the browser's native summary toggle double-flip the first click.
    const details = document.getElementById(anchor);
    if (details instanceof HTMLDetailsElement && !details.open) details.open = true;
    window.setTimeout(() => details?.scrollIntoView({ block: 'start' }), 50);
  };

  // The ClientRouter replaces the page DOM; re-apply the deep link on every
  // navigation so /faq#q-… keeps opening its question after route swaps.
  // hashchange covers same-document hash navigation (no reload, no page-load).
  useEffect(() => {
    applyHash();
    document.addEventListener('astro:page-load', applyHash);
    window.addEventListener('hashchange', applyHash);
    wrapperRef.current?.setAttribute('data-faq-ready', 'true');
    return () => {
      document.removeEventListener('astro:page-load', applyHash);
      window.removeEventListener('hashchange', applyHash);
    };
  }, []);

  const groups = useMemo(() => {
    const visible = searchFaq(query, questions);
    return categories.map((category) => ({
      category,
      items: visible.filter((question) => question.categoryId === category.id),
    }));
  }, [categories, questions, query]);

  const hasResults = searchFaq(query, questions).length > 0;
  const term = query.trim();
  const countLabel = (count: number) => (count === 1 ? labels.resultsOne : `${count} ${labels.resultsMany}`);

  const copyLink = async (question: FaqQuestion) => {
    const anchor = questionAnchor(question);
    const url = `${window.location.origin}${window.location.pathname}#${anchor}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedAnchor(anchor);
      window.setTimeout(() => setCopiedAnchor((prev) => (prev === anchor ? '' : prev)), 2000);
    } catch (error) {
      console.error('[faq] copy link failed:', error);
    }
  };

  return (
    <div className="flex flex-col gap-10" ref={wrapperRef}>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="faq-search" className="text-xs font-medium tracking-widest text-mute uppercase">
          {labels.searchLabel}
        </label>
        <div className="relative">
          <input
            id="faq-search"
            type="search"
            value={query}
            placeholder={labels.searchPlaceholder}
            onChange={(event) => setQuery(event.target.value)}
            data-faq-search
            className={`${inputClass} pr-16`}
          />
          {term !== '' && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute inset-y-0 right-2 flex h-8 items-center rounded-full px-3 text-xs text-mute transition-colors duration-500 ease-fluid hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <span className="text-trim">{labels.searchClear}</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2" data-faq-cats>
        {categories.map((category) => (
          <a
            key={category.id}
            href={`#cat-${category.id}`}
            className="rounded-full border border-rule bg-paper px-4 py-1.5 text-xs text-ink-soft transition-colors duration-500 ease-fluid hover:border-accent hover:text-accent"
          >
            {category.title}
          </a>
        ))}
      </div>

      {!hasResults ? (
        term !== '' ? (
          <p role="status" data-faq-empty className="text-sm text-ink-soft">
            {labels.noResults}
          </p>
        ) : (
          <div className="rounded-lg border border-rule bg-paper-warm p-6">
            <h2 className="font-display text-xl text-ink">{labels.emptyTitle}</h2>
            <p className="mt-2 text-sm leading-6 text-ink-soft">{labels.emptyBody}</p>
          </div>
        )
      ) : (
        groups.map(({ category, items }) =>
          items.length === 0 ? null : (
            <section
              key={category.id}
              id={`cat-${category.id}`}
              className="scroll-mt-28 border-t border-rule pt-8"
              data-faq-section
            >
              <h2 className="font-display text-2xl text-ink">{category.title}</h2>
              <p className="mt-1 text-xs text-mute">{countLabel(items.length)}</p>
              <ul className="mt-4 flex flex-col gap-3">
                {items.map((question) => {
                  const anchor = questionAnchor(question);
                  return (
                    <li key={question.id}>
                      <details
                        className="faq rounded-lg border border-rule bg-paper px-5"
                        id={anchor}
                      >
                        <summary
                          data-faq-question={anchor}
                          className="flex cursor-pointer items-center justify-between gap-4 py-4 font-display text-base leading-snug text-ink sm:text-lg"
                        >
                          {question.question}
                          <span className="faq-icon text-xl text-accent" aria-hidden="true">
                            +
                          </span>
                        </summary>
                        <div className="pb-5">
                          <p className="whitespace-pre-line text-sm leading-6 text-ink-soft" data-faq-answer={anchor}>
                            {question.answer}
                          </p>
                          <button
                            type="button"
                            onClick={() => void copyLink(question)}
                            className="link mt-2 text-xs text-mute transition-colors duration-500 ease-fluid hover:text-accent"
                          >
                            <span className="text-trim">
                              {copiedAnchor === anchor ? labels.copied : labels.copyLink}
                            </span>
                          </button>
                        </div>
                      </details>
                    </li>
                  );
                })}
              </ul>
            </section>
          ),
        )
      )}
    </div>
  );
}
