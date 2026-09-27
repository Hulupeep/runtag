/**
 * Enforcement: scan each non-negotiable rule's scope for its forbidden_patterns,
 * and prove each pattern catches its own example_violation.
 */

const fs = require('fs');
const path = require('path');
const { loadContractRules, listContractFiles } = require('../helpers/contract-loader');

const ROOT = path.join(__dirname, '..', '..');
const SKIP_DIRS = new Set(['node_modules', '.next', '.git', 'Specflow', 'test-results', 'playwright-report']);

function globToRegex(glob) {
  let re = glob
    .replace(/[.+^$()|[\]\\]/g, '\\$&')
    .replace(/\{([^}]+)\}/g, (_, alts) => `(${alts.split(',').join('|')})`)
    .replace(/\*\*\//g, '\u0000')
    .replace(/\*/g, '[^/]*')
    .replace(/\u0000/g, '(?:.*/)?');
  return new RegExp(`^${re}$`);
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(path.relative(ROOT, full).split(path.sep).join('/'));
  }
  return out;
}

const FILES = walk(ROOT);
const CONTRACTS = listContractFiles()
  .filter((f) => !f.startsWith('journey_'))
  .map((f) => ({ file: f, ...loadContractRules(f) }));

describe.each(CONTRACTS)('$file', ({ rules }) => {
  describe.each(rules)('$id: $title', (rule) => {
    const scoped = FILES.filter((f) => rule.scope.some((g) => globToRegex(g).test(f)));

    test('scoped source contains no forbidden patterns', () => {
      const violations = [];
      for (const rel of scoped) {
        const content = fs.readFileSync(path.join(ROOT, rel), 'utf-8');
        for (const p of rule.patterns) {
          if (p.regex.test(content)) violations.push(`${rel}: ${p.message}`);
        }
      }
      expect(violations).toEqual([]);
    });

    test('example_violation is caught by at least one pattern', () => {
      expect(rule.patterns.some((p) => p.regex.test(rule.example_violation))).toBe(true);
    });
  });
});
