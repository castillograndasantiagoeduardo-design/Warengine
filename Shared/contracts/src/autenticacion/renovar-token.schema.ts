import { z } from 'zod';

export const renovarTokenSchema = z.object({
  refreshToken: z.string({ required_error: 'El refresh token es obligatorio.' }),
});

export type RenovarTokenInput = z.infer<typeof renovarTokenSchema>;
