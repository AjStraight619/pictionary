'use server';

import { db } from '@/lib/db';
import { profileSchema } from '@/lib/schemas';
import { mapErrorToMessage } from '@/lib/errors';
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { z } from 'zod';

export const createPlayer = async (values: z.infer<typeof profileSchema>) => {
  const user = await currentUser();
  if (!user || !user.id) redirect('/sign-in');

  const validatedValues = profileSchema.safeParse(values);
  if (!validatedValues.success) {
    return {
      success: false,
      error: mapErrorToMessage(validatedValues.error),
    };
  }

  const { username, email } = validatedValues.data;

  const existingPlayerWithUsername = await db.player.findUnique({
    where: {
      username,
    },
  });

  if (existingPlayerWithUsername) {
    return {
      success: false,
      error: 'Username already taken',
    };
  }

  try {
    await db.player.create({
      data: {
        id: user.id,
        email: email,
        username: username,
      },
    });
    return { success: true, error: null };
  } catch (e) {
    return {
      success: false,
      error: mapErrorToMessage(e),
    };
  }
};
