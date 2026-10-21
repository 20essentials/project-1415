import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MemberProfileError, updateMemberProfile } from '@/features/account/member-profile';

const updateMemberMock = vi.fn();
const elevateMock = vi.fn((fn: unknown) => fn);

vi.mock('@wix/members', () => ({
  members: {
    updateMember: (...args: unknown[]) => updateMemberMock(...args),
  },
}));

vi.mock('@wix/essentials', () => ({
  auth: {
    elevate: (fn: unknown) => elevateMock(fn),
  },
}));

describe('updateMemberProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws NOT_AUTHENTICATED for empty memberId without calling updateMember', async () => {
    await expect(updateMemberProfile('   ', { firstName: 'Ada' })).rejects.toBeInstanceOf(
      MemberProfileError,
    );
    try {
      await updateMemberProfile('   ', { firstName: 'Ada' });
    } catch (error) {
      expect(error).toBeInstanceOf(MemberProfileError);
      expect((error as MemberProfileError).code).toBe('NOT_AUTHENTICATED');
    }
    expect(updateMemberMock).not.toHaveBeenCalled();
  });

  it('trims fields and rejects over limit with INVALID_INPUT', async () => {
    const long = 'a'.repeat(101);
    await expect(updateMemberProfile('m1', { firstName: long })).rejects.toBeInstanceOf(
      MemberProfileError,
    );
    try {
      await updateMemberProfile('m1', { firstName: long });
    } catch (error) {
      expect((error as MemberProfileError).code).toBe('INVALID_INPUT');
    }
    expect(updateMemberMock).not.toHaveBeenCalled();
  });

  it('calls updateMember with trimmed values and only provided fields', async () => {
    updateMemberMock.mockResolvedValue({});
    await updateMemberProfile('member-123', {
      firstName: '  Ada  ',
      lastName: '  Lovelace  ',
      nickname: '  ada  ',
    });
    expect(elevateMock).toHaveBeenCalled();
    expect(updateMemberMock).toHaveBeenCalledWith('member-123', {
      contact: { firstName: 'Ada', lastName: 'Lovelace' },
      profile: { nickname: 'ada' },
    });
  });

  it('throws FAILED when updateMember rejects', async () => {
    updateMemberMock.mockRejectedValue(new Error('boom'));
    await expect(
      updateMemberProfile('m2', { firstName: 'Grace' }),
    ).rejects.toBeInstanceOf(MemberProfileError);
    try {
      await updateMemberProfile('m2', { firstName: 'Grace' });
    } catch (error) {
      expect((error as MemberProfileError).code).toBe('FAILED');
    }
  });
});
