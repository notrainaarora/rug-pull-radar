// Vercel serverless function: GET /api/score?address=0x...
// Rebuilds a token's launch + first-hour facts from the blockchain, scores them with the
// same XGBoost model as the notebook, and explains the score with SHAP.
// The Etherscan key lives only here (as a Vercel environment variable), never in the browser.
'use strict';
const path = require('path');
const fs = require('fs');
const engine = require('./_lib/engine.js');
const { liveFeatures, UserError } = require('./_lib/chain.js');

let DATA;
function data() {
  if (!DATA) DATA = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data.json'), 'utf8'));
  return DATA;
}
const cache = new Map(); // remembers recent answers so repeat lookups are instant

module.exports = async (req, res) => {
  res.setHeader('content-type', 'application/json; charset=utf-8');
  const address = String((req.query && req.query.address) || '').trim().toLowerCase();
  try {
    const d = data();
    if (!d.model) throw new Error('data.json has no model in it. Re-run the export cell in Colab.');
    if (cache.has(address)) return res.status(200).end(JSON.stringify(cache.get(address)));
    const live = await liveFeatures(address, process.env.ETHERSCAN_KEY || '');
    const x = d.model.features.map((f) => (f in live.features ? live.features[f] : NaN));
    const ex = engine.explain(d.model, x);
    const threshold = d.threshold;
    const band = ex.prob >= threshold ? 'high' : ex.prob >= 0.5 ? 'caution' : 'lower';
    const known = (d.tokens || []).find((t) => t.address.toLowerCase() === address);
    const out = {
      ok: true, name: live.name, symbol: live.symbol, address, pool: live.pair,
      launched: live.launched, hours_live: live.hoursLive, provider: live.provider,
      score: ex.score, prob: ex.prob, band, threshold: Math.round(threshold * 100),
      reasons: ex.reasons, features: live.features,
      young: live.hoursLive < 1,
      known: known ? { is_rug: known.is_rug, hours_to_rug: known.hours_to_rug, in_test: known.in_test } : null,
    };
    if (cache.size > 500) cache.clear();
    if (!out.young) cache.set(address, out);
    res.setHeader('cache-control', out.young ? 'no-store' : 's-maxage=86400');
    return res.status(200).end(JSON.stringify(out));
  } catch (e) {
    const user = e instanceof UserError;
    return res.status(user ? 400 : 502).end(JSON.stringify({ ok: false, error: user ? e.message : "We couldn't reach the blockchain just now. Please try again in a moment.", detail: user ? undefined : String(e.message || e).slice(0, 300) }));
  }
};
