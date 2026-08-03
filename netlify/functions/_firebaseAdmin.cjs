// netlify/functions/_firebaseAdmin.js
//
// Shared Firebase Admin initialization for server-side functions. Uses a
// service account (three separate env vars, since a raw multi-line JSON key
// doesn't survive most .env / dashboard UIs cleanly) — see .env.example and
// README.md for how to get these values from the Firebase console.

const admin = require('firebase-admin');

function getAdminApp() {
  if (admin.apps.length) return admin.app();

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // Netlify env vars store newlines escaped as \n — restore real newlines.
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Server is missing Firebase Admin credentials (FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY). ' +
        'Set them in your Netlify site environment variables — see README.md.'
    );
  }

  return admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
  });
}

/**
 * Verifies the Authorization: Bearer <idToken> header against Firebase Auth.
 * Returns the decoded token (contains uid, email, etc.) or throws.
 */
async function verifyAuthHeader(headers) {
  const authHeader = headers.authorization || headers.Authorization || '';
  const match = authHeader.match(/^Bearer (.+)$/);
  if (!match) {
    const err = new Error('Missing Authorization header. Please sign in.');
    err.statusCode = 401;
    throw err;
  }
  const app = getAdminApp();
  try {
    return await admin.auth(app).verifyIdToken(match[1]);
  } catch (e) {
    const err = new Error('Invalid or expired session. Please sign in again.');
    err.statusCode = 401;
    throw err;
  }
}

/**
 * Simple per-user daily rate limit backed by Firestore, so it works correctly
 * across the many separate, stateless invocations a serverless function gets
 * (an in-memory counter would reset on every cold start and wouldn't be
 * shared across concurrent instances).
 */
async function checkAndBumpRateLimit(uid, { limitPerDay = 200 } = {}) {
  const app = getAdminApp();
  const db = admin.firestore(app);
  const dateKey = new Date().toISOString().slice(0, 10);
  const ref = db.collection('users').doc(uid).collection('meta').doc(`ratelimit_${dateKey}`);

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const count = snap.exists ? snap.data().count || 0 : 0;
    if (count >= limitPerDay) {
      const err = new Error('Daily AI usage limit reached. Please try again tomorrow.');
      err.statusCode = 429;
      throw err;
    }
    tx.set(ref, { count: count + 1, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    return count + 1;
  });
}

module.exports = { getAdminApp, verifyAuthHeader, checkAndBumpRateLimit, admin };
