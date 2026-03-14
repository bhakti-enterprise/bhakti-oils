import { z } from 'zod';

import { RefinedPasswordSchema, refineRepeatPassword } from './password.schema';

export const PasswordSignUpSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(255),
    email: z.string().email(),
    password: RefinedPasswordSchema,
    repeatPassword: RefinedPasswordSchema,
  })
  .superRefine(refineRepeatPassword);
