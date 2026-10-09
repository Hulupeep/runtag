#!/usr/bin/env node
// Mechanical privacy gate for specflow-publication: scans one payload file for secrets and personal data.
'use strict';
const fs = require('fs');
const text = fs.readFileSync(process.argv[2], 'utf8');
const FORMS = {
  stripe_key: /\b[sr]k_(live|test)_[A-Za-z0-9]{16,}/,
  resend_key: /\bre_[A-Za-z0-9_]{16,}\b/,
  github_token: /\bgh[pousr]_[A-Za-z0-9]{30,}/,
  aws_key: /\bAKIA[0-9A-Z]{16}\b/,
  private_key: /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  jwt: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/,
  supabase_secret: /\bsb_secret_[A-Za-z0-9]{10,}/,
  db_url_password: /postgres(ql)?:\/\/[^:\s]+:[^@\s]+@/,
  env_assignment: /^\s*[A-Z][A-Z0-9_]*(KEY|SECRET|TOKEN|PASSWORD)\s*=\s*\S+/m,
  real_email: /\b[A-Za-z0-9._%+-]+@(?!(example\.(com|org)|email\.com)\b)[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/,
};
const hits = Object.entries(FORMS).filter(([, re]) => re.test(text)).map(([k]) => k);
process.stdout.write(JSON.stringify({ success: hits.length === 0, actual: { secret_forms_checked: Object.keys(FORMS).length, findings: hits } }));
process.exitCode = hits.length ? 1 : 0;
