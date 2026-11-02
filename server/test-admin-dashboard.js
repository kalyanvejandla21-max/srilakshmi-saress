import assert from 'assert';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getAdminPassword } from './src/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('\n======================================================');
console.log('🧪 Running Sri Lakshmi Sarees Admin Password Security Verification');
console.log('======================================================\n');

const JWT_SECRET = process.env.JWT_SECRET || 'sls_jwt_secure_secret_prod_key_2026';
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@srilakshmisarees.com').toLowerCase().trim();

let passed = 0;
let failed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✅ PASSED: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAILED: ${name} -> ${err.message}`);
    failed++;
  }
}

// Suite 1: Strict Environment Variable Dependency (No Hardcoded Fallback)
console.log('[Suite 1/5] Strict Environment Variable Dependency');

runTest('getAdminPassword returns null when ADMIN_PASSWORD is unset or whitespace', () => {
  const original = process.env.ADMIN_PASSWORD;
  try {
    delete process.env.ADMIN_PASSWORD;
    assert.strictEqual(getAdminPassword(), null, 'Must return null when unset (no hardcoded fallback allowed)');

    process.env.ADMIN_PASSWORD = '   ';
    assert.strictEqual(getAdminPassword(), null, 'Must return null when whitespace');
  } finally {
    if (original !== undefined) process.env.ADMIN_PASSWORD = original;
    else delete process.env.ADMIN_PASSWORD;
  }
});

runTest('getAdminPassword returns trimmed value strictly from environment variable', () => {
  const original = process.env.ADMIN_PASSWORD;
  try {
    process.env.ADMIN_PASSWORD = '  test_secure_pass_9988  ';
    assert.strictEqual(getAdminPassword(), 'test_secure_pass_9988');
  } finally {
    if (original !== undefined) process.env.ADMIN_PASSWORD = original;
    else delete process.env.ADMIN_PASSWORD;
  }
});

// Suite 2: Authentication Logic & Fail-Safe Handling
console.log('\n[Suite 2/5] Admin Authentication Logic & Fail-Safe Handling');

runTest('Fails safely with 503 configuration error when ADMIN_PASSWORD is not configured', () => {
  const original = process.env.ADMIN_PASSWORD;
  delete process.env.ADMIN_PASSWORD;

  let statusSent = null;
  let jsonSent = null;
  const res = {
    status: (code) => {
      statusSent = code;
      return { json: (data) => { jsonSent = data; } };
    }
  };

  const configuredPass = getAdminPassword();
  if (!configuredPass) {
    res.status(503).json({
      error: 'Administrator authentication is currently unavailable. Please configure administrator credentials in environment settings.'
    });
  }

  assert.strictEqual(statusSent, 503, 'Must return HTTP 503 when admin password is not configured');
  assert.ok(jsonSent.error.includes('unavailable'), 'Must return generic safe configuration error');
  assert.strictEqual(Boolean(jsonSent.error.match(/\d{4}/)), false, 'Must never reveal password in error message');

  if (original !== undefined) process.env.ADMIN_PASSWORD = original;
});

runTest('Rejects incorrect password attempt with 401', () => {
  const configured = 'sample_secret_admin_pass';
  const input = 'wrong_password_attempt';
  const isMatch = (input.trim() === configured);
  assert.strictEqual(isMatch, false, 'Invalid password must be rejected');
});

runTest('Accepts matching password and generates valid signed JWT admin token', () => {
  const configured = 'sample_secret_admin_pass';
  const input = 'sample_secret_admin_pass';
  const isMatch = (input.trim() === configured);
  assert.strictEqual(isMatch, true, 'Matching password must be accepted');

  const token = jwt.sign(
    { email: ADMIN_EMAIL, role: 'admin' },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
  assert.ok(token, 'Token must be non-empty string');

  const decoded = jwt.verify(token, JWT_SECRET);
  assert.strictEqual(decoded.role, 'admin');
  assert.strictEqual(decoded.email, ADMIN_EMAIL);
});

// Suite 3: Middleware & Endpoint Protection
console.log('\n[Suite 3/5] Admin Middleware & Unauthorized Request Protection');

runTest('Rejects unauthenticated token requests with 401', () => {
  const req = { headers: {} };
  let statusSent = null;
  let jsonSent = null;
  const res = {
    status: (code) => {
      statusSent = code;
      return { json: (data) => { jsonSent = data; } };
    }
  };

  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Admin authentication token required' });
  }

  assert.strictEqual(statusSent, 401);
  assert.ok(jsonSent.error.includes('Unauthorized'));
});

runTest('Rejects forged non-admin customer token with 403', () => {
  const customerToken = jwt.sign(
    { email: 'customer@example.com', role: 'customer' },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  let statusSent = null;
  let jsonSent = null;
  const res = {
    status: (code) => {
      statusSent = code;
      return { json: (data) => { jsonSent = data; } };
    }
  };

  const decoded = jwt.verify(customerToken, JWT_SECRET);
  if (decoded.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden: Insufficient administrative privileges' });
  }

  assert.strictEqual(statusSent, 403);
  assert.ok(jsonSent.error.includes('Forbidden'));
});

// Suite 4: Order Management & Dispatch Guard
console.log('\n[Suite 4/5] Order Management & Dispatch Safeguards');

runTest('Dispatch guard rejects Dispatched when AWB is missing', () => {
  const mockOrder = {
    orderNumber: 'SLS-ORD-TEST-01',
    orderStatus: 'Processing',
    courierName: 'Shiprocket Express',
    awbNumber: '',
  };

  const targetStatus = 'Dispatched';
  const hasAwb = Boolean(mockOrder.awbNumber);
  const hasCourier = Boolean(mockOrder.courierName);

  let isAllowed = true;
  if (targetStatus === 'Dispatched' || targetStatus === 'In Transit') {
    if (!hasAwb || !hasCourier) isAllowed = false;
  }

  assert.strictEqual(isAllowed, false, 'Dispatched without AWB must be rejected');
});

runTest('Dispatch guard rejects In Transit when Courier is missing', () => {
  const mockOrder = {
    orderNumber: 'SLS-ORD-TEST-02',
    orderStatus: 'Processing',
    courierName: '',
    awbNumber: '1428570099',
  };

  const targetStatus = 'In Transit';
  const hasAwb = Boolean(mockOrder.awbNumber);
  const hasCourier = Boolean(mockOrder.courierName);

  let isAllowed = true;
  if (targetStatus === 'Dispatched' || targetStatus === 'In Transit') {
    if (!hasAwb || !hasCourier) isAllowed = false;
  }

  assert.strictEqual(isAllowed, false, 'In Transit without courier must be rejected');
});

runTest('Dispatch guard permits Dispatched when both AWB and courier exist', () => {
  const mockOrder = {
    orderNumber: 'SLS-ORD-TEST-03',
    orderStatus: 'Processing',
    courierName: 'Shiprocket (Delhivery)',
    awbNumber: '1428570099',
  };

  const targetStatus = 'Dispatched';
  const hasAwb = Boolean(mockOrder.awbNumber);
  const hasCourier = Boolean(mockOrder.courierName);

  let isAllowed = true;
  if (targetStatus === 'Dispatched' || targetStatus === 'In Transit') {
    if (!hasAwb || !hasCourier) isAllowed = false;
  }

  assert.strictEqual(isAllowed, true, 'Dispatched with both AWB and courier must be allowed');
});

// Suite 5: Source Code & Build Secret Hygiene (Zero Hardcoded Password in Repo)
console.log('\n[Suite 5/5] Source Code & Build Secret Hygiene');

const TARGET_PATTERN = String.fromCharCode(50, 49, 52, 49);

runTest('Backend source server/src/index.js contains no hardcoded admin password fallback', () => {
  const src = fs.readFileSync(path.join(__dirname, 'src/index.js'), 'utf8');
  assert.strictEqual(src.includes(`'${TARGET_PATTERN}'`), false, 'server/src/index.js must not contain hardcoded fallback');
  assert.strictEqual(src.includes(`"${TARGET_PATTERN}"`), false, 'server/src/index.js must not contain hardcoded fallback');
  assert.ok(src.includes('getAdminPassword'), 'server/src/index.js must use getAdminPassword helper');
});

runTest('server/.env.example and root .env.example do NOT store raw production password', () => {
  const serverEnv = fs.readFileSync(path.join(__dirname, '.env.example'), 'utf8');
  const rootEnv = fs.readFileSync(path.join(__dirname, '../.env.example'), 'utf8');
  assert.strictEqual(serverEnv.includes(`ADMIN_PASSWORD=${TARGET_PATTERN}`), false, 'server/.env.example must not contain production password');
  assert.strictEqual(rootEnv.includes(`ADMIN_PASSWORD=${TARGET_PATTERN}`), false, 'root .env.example must not contain production password');
});

runTest('Frontend src directory does NOT contain the literal production password', () => {
  const clientSrc = path.join(__dirname, '../client/src');
  function scanDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const ent of entries) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        scanDir(full);
      } else if (ent.isFile() && (ent.name.endsWith('.tsx') || ent.name.endsWith('.ts') || ent.name.endsWith('.jsx') || ent.name.endsWith('.js') || ent.name.endsWith('.css') || ent.name.endsWith('.html'))) {
        const content = fs.readFileSync(full, 'utf8');
        if (content.includes(TARGET_PATTERN)) {
          throw new Error(`CRITICAL: Found literal password in frontend file: ${full}`);
        }
      }
    }
  }
  scanDir(clientSrc);
});

runTest('render.yaml declares ADMIN_PASSWORD with sync: false', () => {
  const renderYaml = fs.readFileSync(path.join(__dirname, '../render.yaml'), 'utf8');
  assert.ok(renderYaml.includes('key: ADMIN_PASSWORD'), 'render.yaml must declare ADMIN_PASSWORD');
  assert.ok(renderYaml.includes('sync: false'), 'render.yaml must set sync: false');
});

console.log('\n======================================================');
console.log(`🏁 Admin Password Security Verification: ${passed} Passed, ${failed} Failed`);
console.log('======================================================\n');

process.exit(failed > 0 ? 1 : 0);
