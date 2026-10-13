import { files } from '@wix/media';
import { members } from '@wix/members';
import { media } from '@wix/sdk';
import { auth } from '@wix/essentials';

export type AvatarImage = {
  _id?: string | null;
  url?: string | null;
};

export type AvatarMember = {
  _id?: string | null;
  profile?: { photo?: AvatarImage | null } | null;
};

const WIX_STATIC_HOST = /(^|\.)wixstatic\.com$/i;

function isWixMediaUrl(url: string): boolean {
  if (url.startsWith('wix:image://')) return true;
  try {
    return WIX_STATIC_HOST.test(new URL(url).hostname);
  } catch {
    return false;
  }
}

// `getScaledToFillImageUrl` only understands a full url or a wix:image:// URI.
// Members store the bare media id, so wrap it before scaling.
function scaledWixUrl(
  identifier: string,
  fallback: string | null,
  width: number,
  height: number,
): string | null {
  const value = identifier.startsWith('http') || identifier.startsWith('wix:')
    ? identifier
    : `wix:image://v1/${identifier}/file`;
  try {
    return media.getScaledToFillImageUrl(value, width, height, {});
  } catch (err) {
    console.error('[member-avatar] scale failed:', err);
    return fallback;
  }
}

// Google-hosted avatars (lh3.googleusercontent.com) rate-limit when the browser
// hotlinks them, so import the photo into Wix Media once and render the Wix copy
// from then on. The import needs a MIME type or an extension, otherwise Wix
// answers 400. If the import is not permitted we return the original URL so the
// avatar still renders, and the <img> onerror falls back to the initials.
export async function resolveMemberAvatarUrl(
  member: AvatarMember,
  width: number,
  height: number,
): Promise<string | null> {
  const photo = member.profile?.photo;
  if (!photo) return null;

  if (photo._id) return scaledWixUrl(photo._id, photo.url ?? null, width, height);

  const url = photo.url;
  if (!url) return null;
  if (isWixMediaUrl(url)) return scaledWixUrl(url, url, width, height);
  if (!member._id) return url;

  try {
    const importFile = auth.elevate(files.importFile);
    const { file } = await importFile(url, {
      mediaType: 'IMAGE',
      mimeType: 'image/jpeg',
      displayName: `member-avatar-${member._id}.jpg`,
    });
    const fileId = file?._id;
    if (!fileId) return file?.url ?? url;

    try {
      await members.updateMember(member._id, {
        profile: { photo: { _id: fileId, url: file.url } },
      });
    } catch (err) {
      console.error('[member-avatar] persist failed:', err);
    }

    return scaledWixUrl(fileId, file.url ?? url, width, height) ?? url;
  } catch (err) {
    console.error('[member-avatar] import failed:', err);
    return url;
  }
}
