import { httpClient } from '@wix/essentials';

export interface FaqCategory {
  id: string;
  title: string;
}

export interface FaqQuestion {
  id: string;
  categoryId: string;
  question: string;
  answer: string;
  slug: string;
  sortOrder: number;
}

interface ApiCategory {
  id?: string;
  title?: string;
  sortOrder?: number;
}

interface ApiQuestionEntry {
  id?: string;
  categoryId?: string;
  question?: string;
  plainText?: string;
  slug?: string;
  sortOrder?: number;
}

const FAQ_API_BASE = 'https://www.wixapis.com/faq/v2';
const PAGE_SIZE = 100;

const faqFetch = httpClient.fetchWithAuth as typeof fetch;

async function faqJson<T>(path: string): Promise<T> {
  const response = await faqFetch(`${FAQ_API_BASE}${path}`);
  if (!response.ok) throw new Error(`[faq] GET ${path} failed: HTTP ${response.status}`);
  return (await response.json()) as T;
}

function toCategory(category: ApiCategory): FaqCategory | null {
  if (!category.id || !category.title) return null;
  return { id: category.id, title: category.title };
}

function toQuestion(entry: ApiQuestionEntry): FaqQuestion | null {
  if (!entry.id || !entry.question || !entry.categoryId) return null;
  return {
    id: entry.id,
    categoryId: entry.categoryId,
    question: entry.question,
    answer: entry.plainText ?? '',
    slug: entry.slug ?? '',
    sortOrder: entry.sortOrder ?? 0,
  };
}

export async function listFaqCategories(): Promise<FaqCategory[]> {
  try {
    const data = await faqJson<{ categories?: ApiCategory[] }>('/categories');
    return (data.categories ?? [])
      .map(toCategory)
      .filter((category): category is FaqCategory => category !== null)
      .sort(
        (a, b) =>
          ((data.categories ?? []).find((c) => c.id === a.id)?.sortOrder ?? 0) -
          ((data.categories ?? []).find((c) => c.id === b.id)?.sortOrder ?? 0),
      );
  } catch (error) {
    console.error('[faq] categories query failed:', error);
    return [];
  }
}

export async function listQuestions(categoryId: string): Promise<FaqQuestion[]> {
  if (!categoryId) return [];
  try {
    const data = await faqJson<{ questionEntries?: ApiQuestionEntry[] }>(
      `/question-entries?categoryId=${encodeURIComponent(categoryId)}&paging.limit=${PAGE_SIZE}`,
    );
    return (data.questionEntries ?? [])
      .map(toQuestion)
      .filter((question): question is FaqQuestion => question !== null)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  } catch (error) {
    console.error('[faq] question entries query failed:', error);
    return [];
  }
}

export interface FaqPageData {
  categories: FaqCategory[];
  questions: FaqQuestion[];
}

export async function getFaqPage(): Promise<FaqPageData> {
  const categories = await listFaqCategories();
  try {
    const data = await faqJson<{ questionEntries?: ApiQuestionEntry[] }>(
      `/question-entries?paging.limit=${PAGE_SIZE}`,
    );
    return buildFaqPage(categories, data.questionEntries ?? []);
  } catch (error) {
    console.error('[faq] question entries query failed:', error);
    return buildFaqPage(categories, []);
  }
}

export function buildFaqPage(categories: FaqCategory[], entries: ApiQuestionEntry[]): FaqPageData {
  const withValidity = entries
    .map(toQuestion)
    .filter((question): question is FaqQuestion => question !== null);
  const categoryIds = new Set(categories.map((category) => category.id));
  return {
    categories,
    questions: withValidity
      .filter((question) => categoryIds.has(question.categoryId))
      .sort((a, b) => a.sortOrder - b.sortOrder),
  };
}

export function normalizeFaqText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase();
}

export function searchFaq(query: string, questions: FaqQuestion[]): FaqQuestion[] {
  const term = normalizeFaqText(query).trim();
  if (!term) return questions;
  return questions.filter((question) =>
    `${normalizeFaqText(question.question)} ${normalizeFaqText(question.answer)}`.includes(term),
  );
}

export function questionAnchor(question: FaqQuestion): string {
  return `q-${question.slug || question.id}`;
}
