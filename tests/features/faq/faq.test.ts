import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildFaqPage,
  getFaqPage,
  listFaqCategories,
  listQuestions,
  normalizeFaqText,
  questionAnchor,
  searchFaq,
} from '@/features/faq/faq';
import type { FaqQuestion } from '@/features/faq/faq';

interface FakeResponse {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}

function jsonResponse(payload: unknown, status = 200): FakeResponse {
  return {
    ok: status === 200,
    status,
    json: async () => payload,
  };
}

const QUESTIONS: FaqQuestion[] = [
  {
    id: 'q1',
    categoryId: 'c2',
    question: 'Is distilled water really mandatory?',
    answer: 'Yes. Tap water carries minerals that slowly poison carnivorous plants.',
    slug: 'is-distilled-water',
    sortOrder: 20,
  },
  {
    id: 'q2',
    categoryId: 'c1',
    question: 'Does my Venus flytrap need full sun?',
    answer: 'Yes — at least six hours of direct sun a day.',
    slug: 'does-my-venus',
    sortOrder: 10,
  },
];

describe('faq data-access', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('listFaqCategories maps and orders categories', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({
          categories: [
            { id: 'b', title: 'Water & feeding', sortOrder: 20 },
            { id: 'a', title: 'Light & placement', sortOrder: 10 },
          ],
        }),
      ),
    );

    const categories = await listFaqCategories();
    expect(categories).toEqual([
      { id: 'a', title: 'Light & placement' },
      { id: 'b', title: 'Water & feeding' },
    ]);
  });

  it('listFaqCategories drops malformed entries', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({
          categories: [{ id: '', title: 'Ghost' }, { title: 'No id' }, { id: 'ok', title: 'Valid' }],
        }),
      ),
    );

    expect(await listFaqCategories()).toEqual([{ id: 'ok', title: 'Valid' }]);
  });

  it('listFaqCategories returns [] when the API fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('boom')));
    expect(await listFaqCategories()).toEqual([]);
  });

  it('listQuestions returns [] without a categoryId', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    expect(await listQuestions('')).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('listQuestions fetches a category with paging and sorts by sortOrder', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({
          questionEntries: [
            { id: '2', categoryId: 'c1', question: 'B?', plainText: 'b', slug: 'b', sortOrder: 2 },
            { id: '1', categoryId: 'c1', question: 'A?', plainText: 'a', slug: 'a', sortOrder: 1 },
          ],
        }),
      );
    vi.stubGlobal('fetch', fetchMock);

    const questions = await listQuestions('c1');
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://www.wixapis.com/faq/v2/question-entries?categoryId=c1&paging.limit=100',
    );
    expect(questions.map((question) => question.id)).toEqual(['1', '2']);
  });

  it('listQuestions returns [] when the API fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('boom')));
    expect(await listQuestions('c1')).toEqual([]);
  });

  it('buildFaqPage keeps only questions whose category survived', () => {
    const page = buildFaqPage(
      [{ id: 'c1', title: 'Light & placement' }],
      QUESTIONS.map((question) => ({
        id: question.id,
        categoryId: question.categoryId,
        question: question.question,
        plainText: question.answer,
        slug: question.slug,
        sortOrder: question.sortOrder,
      })),
    );
    expect(page.questions).toHaveLength(1);
    expect(page.questions[0].id).toBe('q2');
    expect(page.categories).toEqual([{ id: 'c1', title: 'Light & placement' }]);
  });

  it('getFaqPage still lists categories when the questions query fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementationOnce(async () =>
        jsonResponse({ categories: [{ id: 'c1', title: 'Light & placement', sortOrder: 10 }] }),
      ).mockImplementationOnce(async () => {
        throw new Error('boom');
      }),
    );

    const page = await getFaqPage();
    expect(page.categories).toEqual([{ id: 'c1', title: 'Light & placement' }]);
    expect(page.questions).toEqual([]);
  });

  it('getFaqPage returns nothing when both queries fail', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('boom')));
    expect(await getFaqPage()).toEqual({ categories: [], questions: [] });
  });
});

describe('faq search', () => {
  it('normalizeFaqText strips diacritics and lowercases', () => {
    expect(normalizeFaqText('¿Cuánto Riego Díaz?')).toBe('¿cuanto riego diaz?');
  });

  it('searchFaq matches question and answer text', () => {
    const hits = searchFaq('distilled', QUESTIONS);
    expect(hits).toHaveLength(1);
    expect(hits[0].id).toBe('q1');
  });

  it('searchFaq matches across accents via normalization', () => {
    expect(searchFaq('need full sún', QUESTIONS)).toHaveLength(1);
  });

  it('searchFaq returns everything for a blank query', () => {
    expect(searchFaq('   ', QUESTIONS)).toHaveLength(2);
  });

  it('searchFaq finds nothing for unknown terms', () => {
    expect(searchFaq('orchid', QUESTIONS)).toEqual([]);
  });
});

describe('faq anchors', () => {
  it('questionAnchor prefers the slug', () => {
    expect(questionAnchor(QUESTIONS[1])).toBe('q-does-my-venus');
  });

  it('questionAnchor falls back to the id when the slug is missing', () => {
    expect(questionAnchor({ ...QUESTIONS[1], slug: '' })).toBe('q-q2');
  });
});
