import { createAuthClient } from 'better-auth/react';
import { inferAdditionalFields, jwtClient } from 'better-auth/client/plugins';
import type { auth } from './auth';

export const authClient = createAuthClient({
    baseURL: 'http://localhost:3000',
    plugins: [
        inferAdditionalFields<typeof auth>(), 
        jwtClient()
    ],
});
