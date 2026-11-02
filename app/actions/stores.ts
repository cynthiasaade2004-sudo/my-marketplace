'use server';

import { auth } from '@/auth';
import { db } from '@/src/prisma/db';

type CreateStoreResult =
  | { success: true; storeId: string }
  | { success: false; error: string };

export async function createStoreAction(formData: FormData): Promise<CreateStoreResult> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return { success: false, error: 'Sign in to create a store.' };
  }

  const nameEntry = formData.get('name');
  const descriptionEntry = formData.get('description');
  if (
    typeof nameEntry !== 'string' ||
    (descriptionEntry !== null && typeof descriptionEntry !== 'string')
  ) {
    return { success: false, error: 'Enter a valid store name and description.' };
  }

  const name = nameEntry.trim();
  const description = typeof descriptionEntry === 'string' ? descriptionEntry.trim() : '';
  if (!name || name.length > 100 || description.length > 500) {
    return {
      success: false,
      error: 'Store name is required (up to 100 characters); description must be 500 characters or less.',
    };
  }

  try {
    const existingStore = await db.orm.public.Store
      .select('id')
      .where({ userId })
      .first();
    if (existingStore) {
      return { success: true, storeId: existingStore.id };
    }

    const storeWithSameName = await db.orm.public.Store
      .select('id')
      .where({ name })
      .first();
    if (storeWithSameName) {
      return { success: false, error: 'A store with that name already exists.' };
    }

    const slugBase = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'store';
    const store = await db.transaction(async (tx) => {
      const createdStore = await tx.orm.public.Store.create({
        name,
        slug: `${slugBase}-${Date.now()}`,
        description: description || null,
        userId,
      });
      await tx.orm.public.User.where({ id: userId }).update({ role: 'SELLER' });
      return createdStore;
    });

    return { success: true, storeId: store.id };
  } catch (error) {
    console.error('[CREATE_STORE]', error);
    return { success: false, error: 'Could not create your store. Please try again.' };
  }
}
