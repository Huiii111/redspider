// DEV ONLY. See _fake.js.
import { fakeAdapter } from './_fake.js';

export default fakeAdapter({
  id: 'fake',
  name: 'Fake literal matcher (dev only)',
  rules: [
    { id: 'FAKE_UNENCRYPTED', re: /^\s*(encrypted|storage_encrypted)\s*=\s*false\b/m, message: 'Storage is not encrypted' },
    { id: 'FAKE_PUBLIC_DB', re: /^\s*publicly_accessible\s*=\s*true\b/m, message: 'Database is public' },
    { id: 'FAKE_NO_ROTATION', re: /^\s*enable_key_rotation\s*=\s*false\b/m, message: 'Key rotation is off' },
    { id: 'FAKE_WILDCARD', re: /"?Action"?\s*[:=]\s*"\*"/m, message: 'Wildcard action' },
    { id: 'FAKE_WORLD_OPEN', re: /"(0\.0\.0\.0\/0|::\/0)"/m, message: 'Open to the world' },
  ],
});
