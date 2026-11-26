/* Rug-Pull Radar scoring engine.
   The same code runs in the browser (Pump Alarm) and in the Vercel function (live token check).
   It re-creates, in JavaScript, exactly what the notebook does in Python:
   - the XGBoost model's decision trees -> a risk score
   - SHAP (TreeSHAP) -> how much each fact pushed the score up or down
   - the plain-English sentences for each fact
   - the Pump Alarm word model (TF-IDF + logistic regression) */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.RadarEngine = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const isMissing = (v) => v === null || v === undefined || (typeof v === 'number' && isNaN(v));

  // ---------- Model: walk each tree ----------
  function prepTree(node, featIndex) {
    // turn the dumped tree into flat arrays (fast, and needed by TreeSHAP)
    const T = { left: [], right: [], miss: [], feat: [], thr: [], value: [], cover: [] };
    const idmap = {};
    const order = [];
    (function collect(n) { idmap[n.nodeid] = order.length; order.push(n); (n.children || []).forEach(collect); })(node);
    order.forEach((n, k) => {
      if ('leaf' in n) {
        T.left[k] = T.right[k] = T.miss[k] = -1; T.feat[k] = -1; T.thr[k] = 0;
        T.value[k] = n.leaf; T.cover[k] = n.cover;
      } else {
        const f = /^f\d+$/.test(n.split) && !(n.split in featIndex) ? +n.split.slice(1) : featIndex[n.split];
        T.left[k] = idmap[n.yes]; T.right[k] = idmap[n.no]; T.miss[k] = idmap[n.missing];
        T.feat[k] = f; T.thr[k] = n.split_condition; T.cover[k] = n.cover; T.value[k] = 0;
      }
    });
    // internal node value = cover-weighted average of its children (used by TreeSHAP)
    (function fill(k) {
      if (T.feat[k] < 0) return T.value[k];
      const l = fill(T.left[k]), r = fill(T.right[k]);
      T.value[k] = (l * T.cover[T.left[k]] + r * T.cover[T.right[k]]) / T.cover[k];
      return T.value[k];
    })(0);
    return T;
  }

  function prepModel(model) {
    if (model._prepped) return model._prepped;
    const featIndex = {};
    model.features.forEach((f, i) => (featIndex[f] = i));
    model._prepped = model.trees.map((t) => prepTree(t, featIndex));
    return model._prepped;
  }

  function nextNode(T, k, x) {
    const v = x[T.feat[k]];
    if (isMissing(v)) return T.miss[k];
    return Math.fround(v) < T.thr[k] ? T.left[k] : T.right[k];
  }

  function predict(model, x) {
    let m = model.base_margin;
    for (const T of prepModel(model)) {
      let k = 0;
      while (T.feat[k] >= 0) k = nextNode(T, k, x);
      m += T.value[k];
    }
    return 1 / (1 + Math.exp(-m));
  }

  // ---------- TreeSHAP (Lundberg et al. 2018, Algorithm 2) ----------
  function treeShapOne(T, x, phi) {
    const maxd = 64;
    function extend(path, len, pz, po, pi) {
      path[len] = { d: pi, z: pz, o: po, w: len === 0 ? 1 : 0 };
      for (let i = len - 1; i >= 0; i--) {
        path[i + 1].w += po * path[i].w * (i + 1) / (len + 1);
        path[i].w = pz * path[i].w * (len - i) / (len + 1);
      }
    }
    function unwind(path, len, i) {
      const po = path[i].o, pz = path[i].z;
      let n = path[len].w;
      for (let j = len - 1; j >= 0; j--) {
        if (po !== 0) {
          const t = path[j].w;
          path[j].w = n * (len + 1) / ((j + 1) * po);
          n = t - path[j].w * pz * (len - j) / (len + 1);
        } else {
          path[j].w = path[j].w * (len + 1) / (pz * (len - j));
        }
      }
      for (let j = i; j < len; j++) { path[j].d = path[j + 1].d; path[j].z = path[j + 1].z; path[j].o = path[j + 1].o; }
    }
    function unwoundSum(path, len, i) {
      const po = path[i].o, pz = path[i].z;
      let total = 0, n = path[len].w;
      for (let j = len - 1; j >= 0; j--) {
        if (po !== 0) {
          const t = n * (len + 1) / ((j + 1) * po);
          total += t;
          n = path[j].w - t * pz * (len - j) / (len + 1);
        } else {
          total += path[j].w / (pz * (len - j) / (len + 1));
        }
      }
      return total;
    }
    function recurse(k, parentPath, len, pz, po, pi) {
      const path = parentPath.slice(0, len).map((e) => ({ ...e }));
      extend(path, len, pz, po, pi);
      if (T.feat[k] < 0) {
        for (let i = 1; i <= len; i++) {
          const w = unwoundSum(path, len, i);
          phi[path[i].d] += w * (path[i].o - path[i].z) * T.value[k];
        }
        return;
      }
      const hot = nextNode(T, k, x);
      const cold = hot === T.left[k] ? T.right[k] : T.left[k];
      let iz = 1, io = 1, d = T.feat[k];
      let pathLen = len;
      let p;
      for (p = 1; p <= len; p++) if (path[p].d === d) break;
      if (p <= len) {
        iz = path[p].z; io = path[p].o;
        unwind(path, len, p);
        pathLen = len - 1;
      }
      recurse(hot, path, pathLen + 1, iz * T.cover[hot] / T.cover[k], io, d);
      recurse(cold, path, pathLen + 1, iz * T.cover[cold] / T.cover[k], 0, d);
    }
    void maxd;
    recurse(0, [], 0, 1, 1, -1);
  }

  function shapValues(model, x) {
    const phi = new Array(model.features.length).fill(0);
    for (const T of prepModel(model)) treeShapOne(T, x, phi);
    return phi;
  }

  // ---------- Plain-English reasons (same wording as the notebook) ----------
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const fmt = (v, d) => Number(v).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  // ETH amounts: say 'no ETH' or 'less than 0.01 ETH' instead of a confusing '0.00 ETH'
  const eth = (v) => (Number(v) <= 0 ? 'no ETH' : Number(v) < 0.01 ? 'less than 0.01 ETH' : `${fmt(v, 2)} ETH`);
  function sentence(f, v) {
    if (isMissing(v)) {
      if (f === 'eth_in_pool_1h') return 'No pool balance was recorded in the first hour';
      if (f === 'pool_change_1h') return "The pool's ETH change in the first hour couldn't be measured";
      return 'No first-hour data for ' + f;
    }
    switch (f) {
      case 'init_liq_eth': return `The creator put ${fmt(v, 1)} ETH into the trading pool at launch`;
      case 'log_init_tokens': return `About ${fmt(Math.pow(10, v), 0)} tokens were put into the pool`;
      case 'decimals': return `The token uses ${fmt(v, 0)} decimal places (most tokens use 18)`;
      case 'creator_prior_tokens': return `The same creator launched ${fmt(v, 0)} token(s) before this one`;
      case 'meme_word': return v ? "The name uses hype words like 'inu', 'doge' or 'moon'" : 'The name has no common hype words';
      case 'non_ascii': return v ? 'The name or symbol contains emoji or unusual characters' : 'The name uses plain characters';
      case 'name_len': return `The name is ${fmt(v, 0)} characters long`;
      case 'dow': return `It launched on a ${DAYS[v | 0]}`;
      case 'lp_burned_share': return v > 0 ? `The creator burned ${Math.round(v * 100)}% of their pool tokens in hour one` : 'The creator kept all their pool tokens (they can still pull the money out)';
      case 'unique_buyers': return `${fmt(v, 0)} different wallets bought in the first hour`;
      case 'n_swaps': return `${fmt(v, 0)} trades happened in the first hour`;
      case 'n_buys': return `${fmt(v, 0)} buys in the first hour`;
      case 'n_sells': return `${fmt(v, 0)} sells in the first hour`;
      case 'sell_buy_ratio': return `There were ${fmt(v, 2)} sells for every buy`;
      case 'eth_bought': return `Buyers put in ${eth(v)} in the first hour`;
      case 'eth_sold': return `Sellers took out ${eth(v)} in the first hour`;
      case 'eth_in_pool_1h': return `The pool held ${fmt(v, 2)} ETH at the one-hour mark`;
      case 'pool_change_1h': return `The pool's ETH changed by ${v >= 0 ? '+' : ''}${Math.round(v * 100)}% in the first hour`;
      case 'n_mints': return `Liquidity was added ${fmt(v, 0)} time(s) in the first hour`;
      case 'n_burns': return `Liquidity was removed ${fmt(v, 0)} time(s) in the first hour`;
      case 'hit_1000_cap': return v ? 'Very busy: over 1,000 pool events in the first hour' : 'Under 1,000 pool events in the first hour';
      default: return `${f} = ${v}`;
    }
  }

  function explain(model, x) {
    const p = predict(model, x);
    const sv = shapValues(model, x);
    const top = sv.map((s, i) => i).sort((a, b) => Math.abs(sv[b]) - Math.abs(sv[a])).slice(0, 3);
    return {
      prob: p, score: Math.round(100 * p),
      reasons: top.map((j) => ({ text: sentence(model.features[j], x[j]), effect: sv[j] > 0 ? 'up' : 'down', weight: Math.abs(sv[j]) })),
    };
  }

  // ---------- Pump Alarm (TF-IDF + logistic regression) ----------
  function cleanMsg(t) {
    return t.replace(/https?:\/\/\S+|www\.\S+|t\.me\/\S+/g, ' URL ')
      .replace(/@\w+/g, ' USER ')
      .replace(/\+\d[\d\s\-()]{7,}\d/g, ' PHONE ')
      .replace(/\s+/g, ' ').trim();
  }
  function pumpScore(pump, message) {
    const words = (cleanMsg(message).toLowerCase().match(/[\p{L}\p{N}_][\p{L}\p{N}\p{M}_]+/gu) || []);
    const grams = words.slice();
    for (let i = 0; i + 1 < words.length; i++) grams.push(words[i] + ' ' + words[i + 1]);
    const counts = {};
    grams.forEach((g) => { if (g in pump.vocab) counts[g] = (counts[g] || 0) + 1; });
    const terms = Object.keys(counts);
    const vals = terms.map((g) => (1 + Math.log(counts[g])) * pump.idf[pump.vocab[g]]);
    const norm = Math.sqrt(vals.reduce((s, v) => s + v * v, 0)) || 1;
    let z = pump.intercept;
    const contrib = terms.map((g, i) => {
      const c = (vals[i] / norm) * pump.coef[pump.vocab[g]];
      z += c;
      return { word: g, c };
    });
    const p = 1 / (1 + Math.exp(-z));
    const top = contrib.filter((c) => c.c > 0).sort((a, b) => b.c - a.c).slice(0, 3).map((c) => c.word);
    return { prob: p, score: Math.round(100 * p), alarm: p >= 0.5, words: top };
  }

  return { predict, shapValues, explain, sentence, pumpScore, cleanMsg };
});
