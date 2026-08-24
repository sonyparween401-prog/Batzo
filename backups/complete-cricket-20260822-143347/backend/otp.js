const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const OTP_FILE = path.join(__dirname, 'data', 'otp.json');
const OTP_EXPIRY_MS = 5 * 60 * 1000;
const RESEND_MS = 30 * 1000;
const MAX_ATTEMPTS = 5;

function ensureStore() {
  const dir = path.dirname(OTP_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(OTP_FILE)) fs.writeFileSync(OTP_FILE, '{}');
}

function readStore() {
  ensureStore();
  try {
    return JSON.parse(fs.readFileSync(OTP_FILE, 'utf8') || '{}');
  } catch {
    return {};
  }
}

function writeStore(data) {
  ensureStore();
  fs.writeFileSync(OTP_FILE, JSON.stringify(data, null, 2));
}

function normalizeMobile(mobile) {
  return String(mobile || '').replace(/\D/g, '').slice(-10);
}

function hashOtp(otp) {
  return crypto.createHash('sha256').update(String(otp)).digest('hex');
}

function generateOtp() {
  return String(crypto.randomInt(100000, 1000000));
}

function requestOtp(mobile) {
  const phone = normalizeMobile(mobile);
  if (phone.length !== 10) {
    throw new Error('Enter a valid 10 digit mobile number.');
  }

  const store = readStore();
  const existing = store[phone];
  const now = Date.now();

  if (existing && existing.lastSent && now - existing.lastSent < RESEND_MS) {
    const wait = Math.ceil((RESEND_MS - (now - existing.lastSent)) / 1000);
    const err = new Error(`Please wait ${wait} seconds before requesting another OTP.`);
    err.code = 'RATE_LIMIT';
    throw err;
  }

  const otp = generateOtp();

  store[phone] = {
    otpHash: hashOtp(otp),
    createdAt: now,
    expiresAt: now + OTP_EXPIRY_MS,
    lastSent: now,
    attempts: 0
  };

  writeStore(store);

  return {
    phone,
    otp,
    expiresInSeconds: 300
  };
}

function verifyOtp(mobile, otp) {
  const phone = normalizeMobile(mobile);
  const code = String(otp || '').replace(/\D/g, '');

  if (phone.length !== 10) throw new Error('Invalid mobile number.');
  if (!/^\d{6}$/.test(code)) throw new Error('OTP must be 6 digits.');

  const store = readStore();
  const record = store[phone];

  if (!record) throw new Error('OTP not found. Request a new OTP.');

  if (Date.now() > record.expiresAt) {
    delete store[phone];
    writeStore(store);
    throw new Error('OTP expired. Request a new OTP.');
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    delete store[phone];
    writeStore(store);
    throw new Error('Too many incorrect attempts. Request a new OTP.');
  }

  if (hashOtp(code) !== record.otpHash) {
    record.attempts += 1;
    writeStore(store);
    throw new Error('Incorrect OTP.');
  }

  delete store[phone];
  writeStore(store);

  return { phone, verified: true };
}

module.exports = {
  requestOtp,
  verifyOtp
};
