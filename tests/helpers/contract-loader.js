/**
 * Shared helper: parse YAML contracts → extract patterns → compile regex.
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const CONTRACTS_DIR = path.join(__dirname, '..', '..', 'docs', 'contracts');

function yamlPatternToRegex(patternStr) {
  const trimmed = patternStr.trim();
  const match = trimmed.match(/^\/(.+)\/([gimsuy]*)$/s);
  if (!match) {
    throw new Error(`Invalid regex pattern format: ${trimmed}`);
  }
  return new RegExp(match[1], match[2]);
}

function loadContract(filename) {
  const filepath = path.join(CONTRACTS_DIR, filename);
  const content = fs.readFileSync(filepath, 'utf-8');
  return yaml.load(content);
}

function extractRules(contract) {
  const rules = contract.rules?.non_negotiable || [];
  return rules.map((rule) => {
    const patterns = (rule.behavior?.forbidden_patterns || []).map((fp) => ({
      regex: yamlPatternToRegex(fp.pattern),
      message: fp.message,
      raw: fp.pattern,
    }));
    return {
      id: rule.id,
      title: rule.title,
      scope: rule.scope || [],
      patterns,
      example_violation: rule.behavior?.example_violation || '',
      example_compliant: rule.behavior?.example_compliant || '',
    };
  });
}

function loadContractRules(filename) {
  const contract = loadContract(filename);
  return {
    meta: contract.contract_meta,
    llm_policy: contract.llm_policy,
    rules: extractRules(contract),
    raw: contract,
  };
}

function listContractFiles() {
  return fs.readdirSync(CONTRACTS_DIR).filter((f) => f.endsWith('.yml') || f.endsWith('.yaml'));
}

module.exports = {
  yamlPatternToRegex,
  loadContract,
  extractRules,
  loadContractRules,
  listContractFiles,
  CONTRACTS_DIR,
};
