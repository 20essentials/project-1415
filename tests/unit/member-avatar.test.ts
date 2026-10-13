import { beforeEach, describe, expect, it, vi } from 'vitest';

const { importFile, updateMember, getScaledToFillImageUrl } = vi.hoisted(() => ({
  importFile: vi.fn(),
  updateMember: vi.fn(),
  getScaledToFillImageUrl: vi.fn(),
}));

vi.mock('@wix/media', () => ({ files: { importFile } }));
vi.mock('@wix/members', () => ({ members: { updateMember } }));
vi.mock('@wix/sdk', () => ({ media: { getScaledToFillImageUrl } }));

import { resolveMemberAvatarUrl } from '@/utils/member-avatar';

const GOOGLE_URL = 'https://lh3.googleusercontent.com/a/abc=s96-c';
const WIX_URL = 'https://static.wixstatic.com/media/wix-id';

beforeEach(() => {
  vi.resetAllMocks();
  getScaledToFillImageUrl.mockImplementation((value: string) => {
    const id = value.startsWith('wix:image://v1/')
      ? value.slice('wix:image://v1/'.length).split('/')[0]
      : value.split('/').pop();
    return `https://static.wixstatic.com/media/${id}`;
  });
});

describe('resolveMemberAvatarUrl', () => {
  it('returns null when there is no photo', async () => {
    expect(await resolveMemberAvatarUrl({ _id: 'm1' }, 192, 192)).toBeNull();
  });

  it('scales the Wix copy when a media _id is present', async () => {
    const url = await resolveMemberAvatarUrl(
      { _id: 'm1', profile: { photo: { _id: 'wix-id', url: GOOGLE_URL } } },
      192,
      192,
    );

    expect(getScaledToFillImageUrl).toHaveBeenCalledWith('wix:image://v1/wix-id/file', 192, 192, {});
    expect(url).toBe(WIX_URL);
    expect(importFile).not.toHaveBeenCalled();
    expect(updateMember).not.toHaveBeenCalled();
  });

  it('falls back to the photo url when scaling a media _id fails', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getScaledToFillImageUrl.mockImplementation(() => {
      throw new Error('bad id');
    });

    const url = await resolveMemberAvatarUrl(
      { _id: 'm1', profile: { photo: { _id: 'wix-id', url: WIX_URL } } },
      192,
      192,
    );

    expect(url).toBe(WIX_URL);
    spy.mockRestore();
  });

  it('imports an external photo once and persists the Wix copy', async () => {
    importFile.mockResolvedValue({ file: { _id: 'wix-id', url: WIX_URL } });
    updateMember.mockResolvedValue({});

    const url = await resolveMemberAvatarUrl(
      { _id: 'm1', profile: { photo: { url: GOOGLE_URL } } },
      192,
      192,
    );

    expect(importFile).toHaveBeenCalledWith(GOOGLE_URL, {
      mediaType: 'IMAGE',
      mimeType: 'image/jpeg',
      displayName: 'member-avatar-m1.jpg',
    });
    expect(updateMember).toHaveBeenCalledWith('m1', {
      profile: { photo: { _id: 'wix-id', url: WIX_URL } },
    });
    expect(url).toBe(WIX_URL);
  });

  it('still returns the Wix copy when persisting the media _id fails', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    importFile.mockResolvedValue({ file: { _id: 'wix-id', url: WIX_URL } });
    updateMember.mockRejectedValue(new Error('no permission'));

    const url = await resolveMemberAvatarUrl(
      { _id: 'm1', profile: { photo: { url: GOOGLE_URL } } },
      192,
      192,
    );

    expect(url).toBe(WIX_URL);
    spy.mockRestore();
  });

  it('falls back to the original url when the import fails', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    importFile.mockRejectedValue(new Error('boom'));

    const url = await resolveMemberAvatarUrl(
      { _id: 'm1', profile: { photo: { url: GOOGLE_URL } } },
      192,
      192,
    );

    expect(url).toBe(GOOGLE_URL);
    spy.mockRestore();
  });

  it('returns the external url without a member id', async () => {
    const url = await resolveMemberAvatarUrl(
      { profile: { photo: { url: GOOGLE_URL } } },
      192,
      192,
    );

    expect(url).toBe(GOOGLE_URL);
    expect(importFile).not.toHaveBeenCalled();
  });

  it('scales an already Wix-hosted url without importing', async () => {
    const url = await resolveMemberAvatarUrl(
      { _id: 'm1', profile: { photo: { url: WIX_URL } } },
      192,
      192,
    );

    expect(url).toBe(WIX_URL);
    expect(importFile).not.toHaveBeenCalled();
  });
});
