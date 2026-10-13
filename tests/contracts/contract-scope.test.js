/**
 * AC-SHELL-12: every non-negotiable rule must scan at least one real file,
 * unless it is a default rule mirrored onto the real directories by feature_app_defaults.yml.
 */
const fs = require('fs');
const path = require('path');
const { loadContract, listContractFiles } = require('../helpers/contract-loader');

const ROOT = path.join(__dirname, '..', '..');
const SKIP = new Set(['node_modules', '.next', '.git', 'Specflow', 'test-results', 'playwright-report', '.specflow']);

function globToRegex(glob) {
  const re = glob
    .replace(/[.+^$()|[\]\\]/g, '\\$&')
    .replace(/\{([^}]+)\}/g, (_, alts) => `(${alts.split(',').join('|')})`)
    .replace(/\*\*\//g, '\u0000')
    .replace(/\*/g, '[^/]*')
    .replace(/\u0000/g, '(?:.*/)?');
  return new RegExp(`^${re}$`);
}
function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(path.relative(ROOT, p).split(path.sep).join('/'));
  }
  return out;
}

const FILES = walk(ROOT);
const CONTRACTS = listContractFiles().filter((f) => !f.startsWith('journey_')).map((f) => ({ f, c: loadContract(f) }));
const MIRRORED = new Set(
  CONTRACTS.flatMap(({ c }) => (c.rules?.non_negotiable || []).map((r) => r.mirrors).filter(Boolean)),
);
const RULES = CONTRACTS.flatMap(({ f, c }) => (c.rules?.non_negotiable || []).map((r) => ({ f, r })));

describe('Contract scope coverage (AC-SHELL-12)', () => {
  test.each(RULES.map(({ f, r }) => [f, r.id, r]))('%s %s scans at least one file or is mirrored', (_f, id, r) => {
    const matched = FILES.filter((file) => (r.scope || []).some((g) => globToRegex(g).test(file)));
    if (matched.length === 0) expect(MIRRORED.has(id)).toBe(true);
    else expect(matched.length).toBeGreaterThan(0);
  });

  test('every mirror names an existing default rule', () => {
    const ids = new Set(RULES.map(({ r }) => r.id));
    for (const m of MIRRORED) expect(ids.has(m)).toBe(true);
  });
});
