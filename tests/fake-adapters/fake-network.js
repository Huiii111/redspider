// DEV ONLY. A second stand-in with different blind spots, so the frontend has more than one column. See _fake.js.
import { fakeAdapter } from './_fake.js';

export default fakeAdapter({
  id: 'fake-net',
  name: 'Fake network and logging matcher (dev only)',
  rules: [
    { id: 'NET_IPV6_ANY', re: /"::\/0"/m, message: 'Ingress from any IPv6 address' },
    { id: 'NET_PLAIN_HTTP', re: /^\s*protocol\s*=\s*"HTTP"/m, message: 'Listener uses plain HTTP' },
    { id: 'LOG_NO_VALIDATION', re: /^\s*enable_log_file_validation\s*=\s*false\b/m, message: 'Log file validation is off', severity: 'MEDIUM' },
    { id: 'LOG_SINGLE_REGION', re: /^\s*is_multi_region_trail\s*=\s*false\b/m, message: 'Trail covers one region', severity: 'LOW' },
    { id: 'S3_VERSIONING', re: /^\s*status\s*=\s*"Suspended"/m, message: 'Versioning suspended', severity: 'LOW' },
  ],
});
