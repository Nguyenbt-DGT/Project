// `profiles` table (DEMO_FEEDBACK_005 #4, 20260719090000_create_profiles.sql): auto-creation on
// sign-up via the handle_new_user trigger, owner-only RLS, and the updated_at trigger. Runs
// against the REAL local Supabase stack (Rule 6.5).

import { afterAll, describe, expect, it } from 'vitest';

import { closeAdminPgPool, createTestClient, signInAsSeedUser, signUpFreshUser } from './support';

afterAll(async () => {
  await closeAdminPgPool();
});

describe('profiles — auto-created on sign-up', () => {
  it('a fresh sign-up gets a profiles row with no display_name by default', async () => {
    const { client, userId } = await signUpFreshUser();
    const { data, error } = await client.from('profiles').select('*').eq('id', userId).single();
    expect(error).toBeNull();
    expect(data?.id).toBe(userId);
    expect(data?.display_name).toBeNull();
  });

  it('display_name passed as sign-up metadata is picked up by the trigger', async () => {
    const client = createTestClient();
    const email = `qa-named-${Date.now()}@example.com`;
    const { data: signUpData, error: signUpError } = await client.auth.signUp({
      email,
      password: 'password123',
      options: { data: { display_name: 'QA Rider' } },
    });
    expect(signUpError).toBeNull();
    const userId = signUpData.user?.id;
    expect(userId).toBeTruthy();

    const { data, error } = await client.from('profiles').select('display_name').eq('id', userId!).single();
    expect(error).toBeNull();
    expect(data?.display_name).toBe('QA Rider');
  });

  it('the seeded rider@example.com user already has a profile row (seed.sql -> trigger)', async () => {
    const user1 = await signInAsSeedUser();
    const { data: authData } = await user1.auth.getUser();
    const { data, error } = await user1
      .from('profiles')
      .select('*')
      .eq('id', authData.user!.id)
      .single();
    expect(error).toBeNull();
    expect(data?.display_name).toBe('Rider');
  });
});

describe('profiles — owner can edit their own row', () => {
  it('updates display_name and bumps updated_at', async () => {
    const { client, userId } = await signUpFreshUser();
    const { data: before } = await client.from('profiles').select('updated_at').eq('id', userId).single();

    const { data, error } = await client
      .from('profiles')
      .update({ display_name: 'Renamed Rider' })
      .eq('id', userId)
      .select('*')
      .single();
    expect(error).toBeNull();
    expect(data?.display_name).toBe('Renamed Rider');
    expect(new Date(data!.updated_at).getTime()).toBeGreaterThanOrEqual(
      new Date(before!.updated_at).getTime()
    );
  });
});

describe('profiles — RLS isolation', () => {
  it('user2 cannot read user1\'s profile', async () => {
    const user1 = await signInAsSeedUser();
    const { data: authData } = await user1.auth.getUser();
    const { client: user2 } = await signUpFreshUser();

    const { data, error } = await user2.from('profiles').select('*').eq('id', authData.user!.id);
    expect(error).toBeNull(); // RLS filters rows silently, not an error, for SELECT
    expect(data).toEqual([]);
  });

  it('user2 cannot update user1\'s profile (matches zero rows)', async () => {
    const user1 = await signInAsSeedUser();
    const { data: authData } = await user1.auth.getUser();
    const { client: user2 } = await signUpFreshUser();

    const { data, error } = await user2
      .from('profiles')
      .update({ display_name: 'Hijacked' })
      .eq('id', authData.user!.id)
      .select();
    expect(error).toBeNull();
    expect(data).toEqual([]);

    const { data: stillOwned } = await user1
      .from('profiles')
      .select('display_name')
      .eq('id', authData.user!.id)
      .single();
    expect(stillOwned?.display_name).not.toBe('Hijacked');
  });

  it('anon cannot select from profiles', async () => {
    const anon = createTestClient();
    const { data, error } = await anon.from('profiles').select('*');
    expect(error).not.toBeNull();
    expect(data).toBeNull();
  });
});
