import { comments } from '@wix/comments';
import { members } from '@wix/members';
import { auth, WIX_APPS } from '@wix/essentials';
import type { RicosDocument } from '@/shared/ricos';

export const BLOG_COMMENTS_APP_ID = WIX_APPS.blogs.id;

interface CommentRecord {
  _id?: string | null;
  commentDate?: Date | string | null;
  _createdDate?: Date | string | null;
  replyCount?: number | null;
  parentComment?: { id?: string | null } | null;
  content?: { richContent?: RicosDocument | null } | null;
  author?: {
    authorName?: string | null;
    memberId?: string | null;
    visitorId?: string | null;
  } | null;
}

interface ListCommentsResponse {
  comments?: CommentRecord[];
}

interface MemberRecord {
  _id?: string | null;
  profile?: {
    nickname?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  } | null;
}

interface ListCommentsQuery {
  (appId: string, options?: Record<string, unknown>): Promise<ListCommentsResponse>;
}

interface CountCommentsQuery {
  (appId: string, options?: Record<string, unknown>): Promise<{ count?: number }>;
}

interface MembersQuery {
  in(propertyName: string, value: string[]): MembersQuery;
  limit(count: number): MembersQuery;
  find(): Promise<{ items?: MemberRecord[] }>;
}

const listCommentsElevated = auth.elevate(
  comments.listCommentsByResource,
) as unknown as ListCommentsQuery;
const countCommentsElevated = auth.elevate(comments.countComments) as unknown as CountCommentsQuery;
const queryMembersElevated = auth.elevate(members.queryMembers) as unknown as (
  options?: Record<string, unknown>,
) => MembersQuery;

// Blog integration (Comments introduction): contextId/resourceId = post referenceId.
export function postCommentContextId(postId: string): string {
  return postId;
}

export interface PostComment {
  id: string;
  authorName: string;
  authorType: 'member' | 'guest';
  createdDate: Date | null;
  text: string;
}

export interface PostCommentsSection {
  items: PostComment[];
  total: number | null;
}

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function flattenText(document: RicosDocument | null | undefined): string {
  if (!document?.nodes) return '';
  const parts: string[] = [];
  const walk = (nodes: RicosDocument['nodes']): void => {
    for (const node of nodes ?? []) {
      const text = (node as { textData?: { text?: string } }).textData?.text;
      if (typeof text === 'string' && text.length > 0) {
        parts.push(text);
      }
      walk((node as { nodes?: RicosDocument['nodes'] }).nodes);
    }
  };
  walk(document.nodes);
  return parts.join('\n').trim();
}

function toComment(record: CommentRecord, namesById: Map<string, string>): PostComment {
  const author = record.author ?? null;
  const memberId = author?.memberId ?? '';
  return {
    id: record._id ?? '',
    authorName: memberId
      ? (namesById.get(memberId) ?? '')
      : (author?.authorName ?? ''),
    authorType: memberId ? 'member' : 'guest',
    createdDate: toDate(record.commentDate ?? record._createdDate),
    text: flattenText(record.content?.richContent ?? null),
  };
}

async function memberDisplayNames(memberIds: string[]): Promise<Map<string, string>> {
  const namesById = new Map<string, string>();
  const ids = [...new Set(memberIds.filter((id) => id.length > 0))];
  if (ids.length === 0) return namesById;
  try {
    const result = await queryMembersElevated().in('_id', ids).limit(ids.length).find();
    for (const record of result.items ?? []) {
      const id = record._id ?? '';
      if (!id) continue;
      const profile = record.profile ?? null;
      const nickname = profile?.nickname ?? '';
      const first = profile?.firstName ?? '';
      const last = profile?.lastName ?? '';
      const name = [nickname || `${first} ${last}`.trim(), nickname ? `${first} ${last}`.trim() : '']
        .find((value) => value.length > 0);
      namesById.set(id, name ?? '');
    }
  } catch (error) {
    console.error('[comments] member names lookup failed:', error);
  }
  return namesById;
}

export async function listPostComments(
  postId: string,
  limit = 50,
): Promise<PostCommentsSection> {
  if (!postId) return { items: [], total: null };
  try {
    const response = await listCommentsElevated(BLOG_COMMENTS_APP_ID, {
      contextId: postCommentContextId(postId),
      resourceId: postCommentContextId(postId),
      commentSort: { order: 'NEWEST_FIRST' },
      cursorPaging: { limit },
    });
    const records = (response.comments ?? []).filter(
      (record) => record._id && !record.parentComment?.id,
    );
    const namesById = await memberDisplayNames(
      records.map((record) => record.author?.memberId ?? '').filter(Boolean),
    );
    return { items: records.map((record) => toComment(record, namesById)), total: records.length };
  } catch (error) {
    console.error(`[comments] list for post "${postId}" failed:`, error);
    return { items: [], total: null };
  }
}

export async function countPostComments(postId: string): Promise<number> {
  if (!postId) return 0;
  try {
    const response = await countCommentsElevated(BLOG_COMMENTS_APP_ID, {
      filter: { resourceId: postId },
    });
    return response.count ?? 0;
  } catch (error) {
    console.error(`[comments] count for post "${postId}" failed:`, error);
    return 0;
  }
}

export function buildCommentRicos(text: string): RicosDocument {
  return {
    nodes: [
      {
        type: 'PARAGRAPH',
        nodes: [
          {
            type: 'TEXT',
            nodes: [],
            textData: { text, decorations: [] },
          },
        ],
      },
    ],
  };
}

export type CommentSubmitCode = 'INVALID_INPUT' | 'NOT_AUTHENTICATED' | 'FAILED';

export class CommentSubmitError extends Error {
  constructor(
    public readonly code: CommentSubmitCode,
    message: string,
  ) {
    super(message);
    this.name = 'CommentSubmitError';
  }
}

export interface CreatedComment {
  id: string;
  status: string | null;
}

function toCreatePayload(postId: string, text: string, memberId?: string) {
  const payload: Record<string, unknown> = {
    appId: BLOG_COMMENTS_APP_ID,
    contextId: postCommentContextId(postId),
    resourceId: postCommentContextId(postId),
    content: { richContent: buildCommentRicos(text) },
  };
  if (memberId) payload.author = { memberId };
  return payload;
}

// The comment author must be real: either the request's member identity (ambient
// call), or — when Wix rejects the ambient identity — the elevated fallback pins
// that same member id (resolved on the server from getCurrentMember, never from
// client input). No anonymous/elevated-as-owner creation.
export async function createPostComment(
  postId: string,
  text: string,
  memberId: string,
): Promise<CreatedComment> {
  const id = postId.trim();
  if (!id) {
    throw new CommentSubmitError('INVALID_INPUT', 'Missing post id');
  }
  try {
    const created = await comments.createComment(toCreatePayload(id, text));
    return { id: created._id ?? '', status: created.status ?? null };
  } catch (error) {
    if (isPermissionError(error)) {
      try {
        const elevated = auth.elevate(comments.createComment) as unknown as (
          payload: Record<string, unknown>,
        ) => Promise<{ _id?: string | null; status?: string | null }>;
        const created = await elevated(toCreatePayload(id, text, memberId));
        return { id: created._id ?? '', status: created.status ?? null };
      } catch (elevatedError) {
        console.error('[comments] createComment (elevated) failed:', elevatedError);
        throw new CommentSubmitError('FAILED', 'Comment creation failed');
      }
    }
    console.error('[comments] createComment failed:', error);
    throw new CommentSubmitError('FAILED', 'Comment creation failed');
  }
}

function isPermissionError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const e = error as { status?: number; details?: { applicationError?: { code?: unknown } } };
  if (e.status === 403) return true;
  const code = typeof e.details?.applicationError?.code === 'string' ? e.details.applicationError.code : '';
  const message = error instanceof Error ? error.message : '';
  return /permission|forbidden|not[_ ]?allowed|unauthenticated|identified/i.test(
    `${code} ${message}`,
  );
}
