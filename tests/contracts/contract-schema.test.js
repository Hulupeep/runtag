/**
 * Schema validation tests for all contracts in docs/contracts/.
 * Verifies: valid YAML, required fields, regex compilability, structural integrity.
 */

const { loadContract, listContractFiles, yamlPatternToRegex } = require('../helpers/contract-loader');

const ALL_FILES = listContractFiles();
// Journey contracts have their own schema (journey_meta) — validated below.
const JOURNEY_FILES = ALL_FILES.filter((f) => f.startsWith('journey_'));
const CONTRACT_FILES = ALL_FILES.filter((f) => !f.startsWith('journey_'));

describe('Contract Schema Validation', () => {
  test('at least one contract exists', () => {
    expect(CONTRACT_FILES.length).toBeGreaterThan(0);
  });

  describe.each(CONTRACT_FILES)('%s', (filename) => {
    let contract;

    beforeAll(() => {
      contract = loadContract(filename);
    });

    test('parses as valid YAML', () => {
      expect(contract).toBeDefined();
      expect(typeof contract).toBe('object');
    });

    test('has contract_meta.id', () => {
      expect(contract.contract_meta).toBeDefined();
      expect(typeof contract.contract_meta.id).toBe('string');
      expect(contract.contract_meta.id.length).toBeGreaterThan(0);
    });

    test('has contract_meta.version', () => {
      expect(contract.contract_meta.version).toBeDefined();
    });

    test('has contract_meta.covers_reqs as non-empty array', () => {
      expect(Array.isArray(contract.contract_meta.covers_reqs)).toBe(true);
      expect(contract.contract_meta.covers_reqs.length).toBeGreaterThan(0);
    });

    test('has contract_meta.owner', () => {
      expect(typeof contract.contract_meta.owner).toBe('string');
    });

    test('has llm_policy.enforce', () => {
      expect(contract.llm_policy).toBeDefined();
      expect(typeof contract.llm_policy.enforce).toBe('boolean');
    });

    test('has llm_policy.override_phrase', () => {
      expect(typeof contract.llm_policy.override_phrase).toBe('string');
      expect(contract.llm_policy.override_phrase).toContain('override_contract:');
    });

    test('has rules.non_negotiable as non-empty array', () => {
      expect(contract.rules).toBeDefined();
      expect(Array.isArray(contract.rules.non_negotiable)).toBe(true);
      expect(contract.rules.non_negotiable.length).toBeGreaterThan(0);
    });

    test('every rule has id and title', () => {
      for (const rule of contract.rules.non_negotiable) {
        expect(typeof rule.id).toBe('string');
        expect(typeof rule.title).toBe('string');
      }
    });

    test('every forbidden_pattern compiles to valid RegExp', () => {
      for (const rule of contract.rules.non_negotiable) {
        for (const fp of rule.behavior.forbidden_patterns) {
          expect(() => yamlPatternToRegex(fp.pattern)).not.toThrow();
        }
      }
    });

    test('every forbidden_pattern has a non-empty message', () => {
      for (const rule of contract.rules.non_negotiable) {
        for (const fp of rule.behavior.forbidden_patterns) {
          expect(typeof fp.message).toBe('string');
          expect(fp.message.length).toBeGreaterThan(0);
        }
      }
    });

    test('every rule has example_violation and example_compliant', () => {
      for (const rule of contract.rules.non_negotiable) {
        expect(rule.behavior.example_violation.trim().length).toBeGreaterThan(0);
        expect(rule.behavior.example_compliant.trim().length).toBeGreaterThan(0);
      }
    });
  });
});

describe('Journey Contract Schema Validation', () => {
  describe.each(JOURNEY_FILES)('%s', (filename) => {
    const journey = loadContract(filename);
    const meta = journey.journey_meta || {};

    test('has journey_meta with required fields', () => {
      expect(meta.id).toMatch(/^J-[A-Z][A-Z0-9-]+$/);
      expect(typeof meta.from_spec).toBe('string');
      expect(Array.isArray(meta.covers_reqs) && meta.covers_reqs.length).toBeTruthy();
      expect(['e2e', 'integration', 'smoke']).toContain(meta.type);
      expect(['critical', 'important', 'future']).toContain(meta.dod_criticality);
      expect(['passing', 'failing', 'not_tested']).toContain(meta.status);
    });

    test('has ordered steps', () => {
      expect(Array.isArray(journey.steps) && journey.steps.length).toBeTruthy();
      journey.steps.forEach((s, i) => expect(s.step).toBe(i + 1));
    });

    test('test_hooks.e2e_test_file exists', () => {
      const file = journey.test_hooks && journey.test_hooks.e2e_test_file;
      expect(typeof file).toBe('string');
      expect(require('fs').existsSync(require('path').join(__dirname, '..', '..', file))).toBe(true);
    });
  });
});
