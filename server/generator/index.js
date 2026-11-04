// Messy Terraform generator: planted clean/faulty pairs for demos and stress testing.
// Output follows docs/corpus-format.md, so `npm run benchmark -- --corpus tests/generated` works on it.
// It does NOT replace tests/heldout/ in the value check.
import { s, raw, attr, block, map, bind, render } from './hcl.js';
import { SCENARIOS, FILLERS } from './scenarios.js';

// mulberry32: small, fast, deterministic.
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const COMMENTS = [
  'TODO: move this into the shared module',
  'managed by platform team, ask in #infra before changing',
  'legacy - do not touch without a change ticket',
  'see OPS-1182',
  'copied from the staging stack',
  'FIXME tags are inconsistent across envs',
  'terraform import was used for this one',
];
const ORGS = ['acme', 'orbit', 'lattice', 'harbor', 'northwind'];
const ENVS = ['prod', 'staging', 'dev', 'shared'];

function makeContext(random) {
  const pick = (xs) => xs[Math.floor(random() * xs.length)];
  const chance = (p) => random() < p;
  const org = pick(ORGS);
  const env = pick(ENVS);
  const bindings = {};
  const tagsMode = pick(['inline', 'local', 'none', 'none']);
  const usedIdents = new Set();

  const ctx = {
    random, pick, chance, org, env, bindings,
    ident(base) {
      const style = pick(['plain', 'env', 'snake', 'this']);
      let id = { plain: base, env: `${base}_${env}`, snake: `${org}_${base}`, this: 'this' }[style];
      while (usedIdents.has(id)) id = `${id}_${Math.floor(random() * 90 + 10)}`;
      usedIdents.add(id);
      return id;
    },
    dnsName() {
      return `${org}-${env}-${Math.floor(random() * 0xffff).toString(16).padStart(4, '0')}`;
    },
    // A value that may appear inline, as a variable default, or as a local. Faults change the
    // binding's value, so the fault lands wherever the value lives.
    bind(name, value, description = null, forcedMode = null) {
      const mode = forcedMode ?? pick(['literal', 'literal', 'var', 'local']);
      bindings[name] = { mode, value, description };
      return bind(name);
    },
    tags() {
      if (tagsMode === 'none') return null;
      if (tagsMode === 'local') {
        if (!bindings.common_tags) bindings.common_tags = { mode: 'local', value: map([['Environment', s(env)], ['Owner', s(`${org}-platform`)]]) };
        return attr('tags', bind('common_tags'));
      }
      return attr('tags', map([['Name', s(`${org}-${env}`)], ['env', s(env)]]));
    },
    shuffle(items, keep = 0) {
      const head = items.slice(0, keep);
      const rest = items.slice(keep);
      for (let i = rest.length - 1; i > 0; i -= 1) {
        const j = Math.floor(random() * (i + 1));
        [rest[i], rest[j]] = [rest[j], rest[i]];
      }
      return [...head, ...rest];
    },
    resource(type, name, body, { countable = false } = {}) {
      const items = body.filter(Boolean);
      if (countable && chance(0.25)) {
        const flag = `create_${name}`;
        bindings[flag] = { mode: 'var', value: { t: 'bool', v: true }, description: null };
        items.unshift(attr('count', raw(`var.${flag} ? 1 : 0`)));
      }
      const blk = block('resource', [type, name], items);
      if (chance(0.3)) blk.comment = pick(COMMENTS);
      for (const item of items) {
        if (chance(0.08)) item.comment = pick(COMMENTS);
        if (chance(0.1)) item.blankBefore = true;
      }
      return blk;
    },
  };
  return ctx;
}

function makeStyle(ctx) {
  return {
    indent: ctx.pick(['  ', '  ', '    ', '\t']),
    eq: ctx.pick(['spaced', 'spaced', 'aligned', 'tight']),
    comment: ctx.pick(['#', '#', '//']),
    listSep: ctx.pick([', ', ',']),
    blankLines: ctx.pick([1, 1, 2]),
    declsFirst: ctx.chance(0.5),
    trailingNewline: ctx.chance(0.85),
    crlf: ctx.chance(0.15),
  };
}

function header(ctx) {
  const blocks = [];
  if (ctx.chance(0.7)) {
    blocks.push(block('terraform', [], [
      attr('required_version', s('>= 1.5')),
      block('required_providers', [], [attr('aws', map([['source', s('hashicorp/aws')], ['version', s(ctx.pick(['~> 5.0', '>= 5.30', '~> 5.60']))]]))]),
    ]));
  }
  if (ctx.chance(0.8)) blocks.push(block('provider', ['aws'], [attr('region', s('eu-west-1'))]));
  return blocks;
}

export const ALL_FAULTS = (() => {
  // Build each scenario once with a throwaway context, just to list its faults.
  const list = [];
  for (const sc of SCENARIOS) for (const f of sc.build(makeContext(rng(1))).faults) list.push({ scenario: sc.id, fault: f.id });
  return list;
})();

/**
 * @param seed   any integer; same seed, same output
 * @param count  number of pairs; cycles through every fault in the catalogue
 * @returns [{ id, title, requirement, clean, faulty, generator }]
 */
export function generate({ seed = 1, count = ALL_FAULTS.length } = {}) {
  const out = [];
  for (let i = 0; i < count; i += 1) {
    const target = ALL_FAULTS[i % ALL_FAULTS.length];
    const random = rng((seed * 0x9e3779b1 + i * 0x85ebca6b) >>> 0);
    const ctx = makeContext(random);
    const style = makeStyle(ctx);
    const head = header(ctx);
    const built = SCENARIOS.find((x) => x.id === target.scenario).build(ctx);
    const fault = built.faults.find((f) => f.id === target.fault);
    const fillers = ctx.shuffle(FILLERS).slice(0, Math.floor(random() * 3)).map((mk) => mk(ctx));
    const body = ctx.shuffle([...built.blocks, ...fillers]);

    const clean = { blocks: [...head, ...body], headerCount: head.length, bindings: ctx.bindings };
    const faulty = structuredClone(clean);
    fault.apply(faulty);

    const cleanText = render(clean, style);
    const faultyText = render(faulty, style);
    if (cleanText === faultyText) throw new Error(`generator: fault ${fault.id} changed nothing (seed ${seed}, case ${i})`);

    out.push({
      id: `gen-${seed}-${String(i + 1).padStart(3, '0')}-${fault.id}`,
      title: fault.title,
      requirement: fault.requirement,
      resource: fault.resource,
      change: fault.change,
      clean: cleanText,
      faulty: faultyText,
      generator: { seed, index: i, scenario: target.scenario, fault: fault.id, style },
    });
  }
  return out;
}
