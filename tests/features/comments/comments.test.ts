import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { listCommentsByResource, countComments, createComment, membersQuery } = vi.hoisted(() => ({
  listCommentsByResource: vi.fn(),
  countComments: vi.fn(),
  createComment: vi.fn(),
  membersQuery: vi.fn(),
}));

vi.mock('@wix/comments', () => ({
  comments: { listCommentsByResource, countComments, createComment },
}));

vi.mock('@wix/members', () => ({
  members: { queryMembers: membersQuery, getCurrentMember: vi.fn() },
}));

import {
  BLOG_COMMENTS_APP_ID,
  buildCommentRicos,
  countPostComments,
  createPostComment,
  listPostComments,
} from '@/features/comments/comments';

const seededComment = {
  _id: 'comment-1',
  commentDate: '2026-10-04T12:00:00.000Z',
  replyCount: 0,
  content: {
    richContent: {
      nodes: [
        {
          type: 'PARAGRAPH',
          nodes: [
            {
              type: 'TEXT',
              textData: { text: 'Full sun changed everything for my flytrap.' },
            },
          ],
        },
      ],
    },
  },
  author: { memberId: 'member-1' },
};

beforeEach(() => {
  membersQuery.mockImplementation(() => {
    const link = {
      in: () => link,
      limit: () => link,
      find: () =>
        Promise.resolve({
          items: [{ _id: 'member-1', profile: { firstName: 'Ada', lastName: 'Fox' } }],
        }),
    };
    return link;
  });
});

afterEach(() => {
  listCommentsByResource.mockReset();
  countComments.mockReset();
  createComment.mockReset();
  membersQuery.mockReset();
});

describe('listPostComments', () => {
  it('queries the blog integration with newest-first sort and maps member names', async () => {
    listCommentsByResource.mockResolvedValue({ comments: [seededComment] });

    const { items } = await listPostComments('post-1');

    expect(listCommentsByResource).toHaveBeenCalledWith(
      BLOG_COMMENTS_APP_ID,
      expect.objectContaining({
        contextId: 'post-1',
        resourceId: 'post-1',
        commentSort: { order: 'NEWEST_FIRST' },
        cursorPaging: { limit: 50 },
      }),
    );
    expect(membersQuery).toHaveBeenCalled();
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id: 'comment-1',
      authorName: 'Ada Fox',
      authorType: 'member',
      text: 'Full sun changed everything for my flytrap.',
    });
  });

  it('flattens multi-paragraph comment bodies and keeps guests as guests', async () => {
    listCommentsByResource.mockResolvedValue({
      comments: [
        {
          _id: 'comment-2',
          author: { authorName: 'Alex' },
          content: {
            richContent: {
              nodes: [
                { type: 'PARAGRAPH', nodes: [{ type: 'TEXT', textData: { text: 'First paragraph' } }] },
                { type: 'PARAGRAPH', nodes: [{ type: 'TEXT', textData: { text: 'Second paragraph' } }] },
              ],
            },
          },
        },
      ],
    });

    const { items } = await listPostComments('post-1');
    expect(items[0]).toMatchObject({ authorName: 'Alex', authorType: 'guest' });
    expect(items[0].text.split('\n')).toEqual(['First paragraph', 'Second paragraph']);
  });

  it('drops replies so only top-level threads render', async () => {
    listCommentsByResource.mockResolvedValue({
      comments: [seededComment, { ...seededComment, _id: 'reply-1', parentComment: { id: 'comment-1' } }],
    });

    const { items } = await listPostComments('post-1');
    expect(items.map((item) => item.id)).toEqual(['comment-1']);
  });

  it('returns an empty list instead of throwing when the API fails', async () => {
    listCommentsByResource.mockRejectedValue(new Error('boom'));

    const { items, total } = await listPostComments('post-1');
    expect(items).toEqual([]);
    expect(total).toBeNull();
  });
});

describe('countPostComments', () => {
  it('counts published comments with the resourceId filter', async () => {
    countComments.mockResolvedValue({ count: 3 });

    expect(await countPostComments('post-1')).toBe(3);
    expect(countComments).toHaveBeenCalledWith(BLOG_COMMENTS_APP_ID, {
      filter: { resourceId: 'post-1' },
    });
  });

  it('returns 0 when counting fails', async () => {
    countComments.mockRejectedValue(new Error('boom'));
    expect(await countPostComments('post-1')).toBe(0);
  });
});

describe('createPostComment', () => {
  it('creates a comment with the blog app ids and the plain text as rich content', async () => {
    createComment.mockResolvedValue({ _id: 'new-1', status: 'PUBLISHED' });

    const { id, status } = await createPostComment('post-1', 'Nice guide', 'member-1');
    expect(id).toBe('new-1');
    expect(status).toBe('PUBLISHED');

    const payload = createComment.mock.calls[0][0] as Record<string, unknown>;
    expect(payload).toMatchObject({
      appId: BLOG_COMMENTS_APP_ID,
      contextId: 'post-1',
      resourceId: 'post-1',
    });
    const content = payload.content as { richContent: { nodes: Array<{ nodes: Array<{ textData: { text: string } }> }> } };
    expect(content.richContent.nodes[0].nodes[0].textData.text).toBe('Nice guide');
  });

  it('retries elevated with the member author when the ambient identity is rejected', async () => {
    createComment
      .mockRejectedValueOnce(Object.assign(new Error('forbidden'), { status: 403 }))
      .mockResolvedValueOnce({ _id: 'new-2', status: 'PENDING' });

    const { status } = await createPostComment('post-1', 'Nice guide', 'member-1');
    expect(status).toBe('PENDING');
    expect(createComment).toHaveBeenCalledTimes(2);
    const retryPayload = createComment.mock.calls[1][0] as Record<string, unknown>;
    expect(retryPayload.author).toEqual({ memberId: 'member-1' });
  });

  it('fails without firing the API when inputs are empty', async () => {
    await expect(createPostComment('', 'hi', 'member-1')).rejects.toMatchObject({
      code: 'INVALID_INPUT',
    });
    expect(createComment).not.toHaveBeenCalled();
  });
});

describe('buildCommentRicos', () => {
  it('builds a single paragraph rich content document', () => {
    const document = buildCommentRicos('Hello');
    const node = document.nodes![0] as { type: string; nodes: Array<{ type: string; textData?: { text: string } }> };
    expect(node.type).toBe('PARAGRAPH');
    expect(node.nodes[0].textData?.text).toBe('Hello');
  });
});
