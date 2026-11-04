// A tiny HCL model and a renderer with deliberately inconsistent house styles.
// All randomness happens before rendering, so a clean/faulty pair renders identically
// except where the fault changed the model.

// --- Value nodes ---
export const s = (v) => ({ t: 'str', v });
export const n = (v) => ({ t: 'num', v });
export const b = (v) => ({ t: 'bool', v });
export const raw = (v) => ({ t: 'raw', v });
export const list = (...v) => ({ t: 'list', v });
export const map = (entries) => ({ t: 'map', v: entries }); // [[key, valueNode], ...]
export const bind = (name) => ({ t: 'bind', v: name });
// An IAM-style JSON document, rendered as a heredoc or as jsonencode({...}).
export const policy = (doc, form) => ({ t: 'policy', v: doc, form });

// --- Body items ---
export const attr = (key, value) => ({ k: 'attr', key, value });
export const block = (name, labels, body) => ({ k: 'block', name, labels, body });

const IDENT = /^[A-Za-z_][A-Za-z0-9_-]*$/;

function str(v) {
  return `"${v.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\$\{/g, () => '$${').replace(/%\{/g, '%%{').replace(/\n/g, '\\n')}"`;
}

function typeOf(node) {
  return { str: 'string', num: 'number', bool: 'bool', list: 'list(string)' }[node.t] ?? 'any';
}

function jsToHcl(value, ind, level) {
  const pad = ind.repeat(level);
  if (Array.isArray(value)) {
    if (value.every((x) => typeof x !== 'object')) return `[${value.map((x) => jsToHcl(x, ind, 0)).join(', ')}]`;
    return `[\n${value.map((x) => `${pad}${ind}${jsToHcl(x, ind, level + 1)}`).join(',\n')},\n${pad}]`;
  }
  if (value && typeof value === 'object') {
    const lines = Object.entries(value).map(([k, v]) => `${pad}${ind}${IDENT.test(k) ? k : str(k)} = ${jsToHcl(v, ind, level + 1)}`);
    return `{\n${lines.join('\n')}\n${pad}}`;
  }
  if (typeof value === 'string') return str(value);
  return String(value);
}

export function render(file, style) {
  const ind = style.indent;
  const { bindings } = file;

  function value(node, level) {
    switch (node.t) {
      case 'str': return str(node.v);
      case 'num': return String(node.v);
      case 'bool': return String(node.v);
      case 'raw': return node.v;
      case 'list': return `[${node.v.map((x) => value(x, level)).join(style.listSep)}]`;
      case 'map': {
        const pad = ind.repeat(level);
        const rows = node.v.map(([k, v]) => `${pad}${ind}${IDENT.test(k) ? k : str(k)} = ${value(v, level + 1)}`);
        return `{\n${rows.join('\n')}\n${pad}}`;
      }
      case 'bind': {
        const bd = bindings[node.v];
        if (!bd) throw new Error(`unknown binding ${node.v}`);
        if (bd.mode === 'literal') return value(bd.value, level);
        return `${bd.mode === 'var' ? 'var' : 'local'}.${node.v}`;
      }
      case 'policy':
        if (node.form === 'heredoc') return `<<EOF\n${JSON.stringify(node.v, null, 2)}\nEOF`;
        return `jsonencode(${jsToHcl(node.v, ind, level)})`;
      default: throw new Error(`unknown value node ${node.t}`);
    }
  }

  function body(items, level) {
    const pad = ind.repeat(level);
    const width = style.eq === 'aligned' ? Math.max(0, ...items.filter((i) => i.k === 'attr').map((i) => i.key.length)) : 0;
    const out = [];
    for (const item of items) {
      if (item.blankBefore && out.length) out.push('');
      if (item.comment) out.push(`${pad}${style.comment} ${item.comment}`);
      if (item.k === 'attr') {
        const eq = style.eq === 'tight' ? '=' : style.eq === 'aligned' ? `${' '.repeat(width - item.key.length)} = ` : ' = ';
        out.push(`${pad}${item.key}${eq}${value(item.value, level)}`);
      } else {
        out.push(...blockLines(item, level));
      }
    }
    return out;
  }

  function blockLines(blk, level) {
    const pad = ind.repeat(level);
    const head = [blk.name, ...blk.labels.map(str)].join(' ');
    if (blk.body.length === 0) return [`${pad}${head} {}`];
    return [`${pad}${head} {`, ...body(blk.body, level + 1), `${pad}}`];
  }

  const varBlocks = [];
  const localItems = [];
  for (const [name, bd] of Object.entries(bindings)) {
    if (bd.mode === 'var') {
      const vb = [attr('type', raw(typeOf(bd.value)))];
      if (bd.description) vb.push(attr('description', s(bd.description)));
      vb.push(attr('default', bd.value));
      varBlocks.push(block('variable', [name], vb));
    } else if (bd.mode === 'local') {
      localItems.push(attr(name, bd.value));
    }
  }
  const decls = [...varBlocks, ...(localItems.length ? [block('locals', [], localItems)] : [])];
  const top = style.declsFirst ? [...file.blocks.slice(0, file.headerCount), ...decls, ...file.blocks.slice(file.headerCount)] : [...file.blocks, ...decls];

  const chunks = top.map((blk) => {
    const lines = blockLines(blk, 0);
    if (blk.comment) lines.unshift(`${style.comment} ${blk.comment}`);
    return lines.join('\n');
  });
  let text = chunks.join('\n'.repeat(style.blankLines + 1));
  if (style.trailingNewline) text += '\n';
  if (style.crlf) text = text.replace(/\n/g, '\r\n');
  return text;
}
