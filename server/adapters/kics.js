// KICS adapter. Resource address and parse checks from Anton; separate output dir from John.
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { config } from '../config.js';
import { run, parseToolJson, versionFrom, ToolError } from './_run.js';

const ID = 'kics';
const REPORT_NAME = 'kics';
// search_key looks like "aws_s3_bucket[data].acl" or "aws_s3_bucket[{{data}}]".
// resource_name is NOT the Terraform name: it is often the bucket's name attribute or "n/a".
const SEARCH_KEY = /^([\w-]+)\[(?:\{\{)?(.+?)(?:\}\})?\]/;

export function resourceAddress(searchKey = '') {
  const m = searchKey.match(SEARCH_KEY);
  return m ? `${m[1]}.${m[2]}` : '';
}

export function parse(json) {
  if (json.files_parsed < json.files_scanned || json.queries_failed_to_execute > 0) {
    throw new ToolError('KICS could not parse this Terraform');
  }
  return (json.queries ?? []).flatMap((q) =>
    (q.files ?? []).map((f) => ({
      toolId: ID,
      ruleId: q.query_id,
      resource: resourceAddress(f.search_key),
      severity: q.severity ?? null,
      message: q.query_name ?? '',
      line: f.line ?? null,
    })),
  );
}

// KICS ships no Windows or Linux binaries since v2, only a Docker image. With KICS_DOCKER_IMAGE
// set, the scan runs in a container with no network, the input mounted read-only, and only the
// output folder writable. That isolation works on every OS, unlike sandbox-exec.
async function runInDocker(dir, out, flags, timeoutMs) {
  const name = `sbs-kics-${randomUUID().slice(0, 8)}`;
  try {
    return await run('docker', [
      'run', '--rm', '--name', name, '--network', 'none', '--read-only', '--tmpfs', '/tmp',
      '-v', `${dir}:/scan:ro`, '-v', `${out}:/out`,
      config.kicsDockerImage, 'scan', '-p', '/scan', '-o', '/out', ...flags,
    ], { timeoutMs });
  } catch (err) {
    // Killing the docker CLI doesn't stop the container, so stop it by name.
    await run('docker', ['rm', '-f', name], { timeoutMs: 15_000 }).catch(() => {});
    throw err;
  }
}

export default {
  id: ID,
  name: 'KICS',
  license: 'Apache-2.0',
  async version() {
    const { stdout } = config.kicsDockerImage
      ? await run('docker', ['run', '--rm', '--network', 'none', config.kicsDockerImage, 'version'], { timeoutMs: 60_000 })
      : await run(config.bins.kics.file, [...config.bins.kics.args, 'version']);
    return versionFrom('KICS', stdout);
  },
  async scan(dir, { timeoutMs } = {}) {
    // Output goes outside the input dir, so the scanner never sees its own report.
    const out = await mkdtemp(path.join(os.tmpdir(), 'sbs-kics-out-'));
    try {
      const flags = ['--output-name', REPORT_NAME, '--report-formats', 'json', '--no-progress', '--type', 'Terraform'];
      // KICS exits 20 to 60 when it finds something; only a missing report is a failure.
      const { code } = config.kicsDockerImage
        ? await runInDocker(dir, out, flags, timeoutMs)
        : await run(config.bins.kics.file, [...config.bins.kics.args, 
          'scan', '-p', dir, '-o', out, ...flags,
          ...(config.kicsQueriesPath ? ['-q', config.kicsQueriesPath] : []),
        ], { sandbox: true, timeoutMs });
      let text;
      try {
        text = await readFile(path.join(out, `${REPORT_NAME}.json`), 'utf8');
      } catch {
        throw new ToolError(`KICS finished without writing a report (exit ${code})`);
      }
      return parse(parseToolJson('KICS', text));
    } finally {
      await rm(out, { recursive: true, force: true });
    }
  },
};
