/* Reads a token's launch and first-hour facts from the public Ethereum blockchain.
   This is a JavaScript copy of the notebook's Part 9 (live_features + hour_one_features).
   It uses Etherscan when the ETHERSCAN_KEY environment variable is set on Vercel,
   and falls back to Blockscout (a free public explorer that needs no key) otherwise. */
'use strict';

const FACTORY = '0x5c69bee701ef814a2b6a3edd4b1652cb9cc5aa6f'; // Uniswap V2 factory
const WETH = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
const LIVE_BLOCKS_PER_HOUR = 300; // one block every 12 seconds since 2022
const OLD_BLOCKS_PER_HOUR = 275;  // about 13 seconds per block in 2020-21 (same as the training data)
const MERGE_BLOCK = 15537394;     // Sep 2022: Ethereum switched to exactly 12-second blocks
const TOPIC = {
  mint: '0x4c209b5fc8ad50758f13e2e1088ba56a560dff690a1c6fef26394f4c03821c4f',
  burn: '0xdccd412f0b1252819cb1fd330b93224ca42612892bb3f4f789976e6d81936496',
  swap: '0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822',
  // copied exactly from the notebook so live features match what the model was trained on
  sync: '0x1c411e9a96e071241c2f21f7726b17ae89e3cab4c78be50e062b03a9fffbad1',
  transfer: '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
};
const ZERO = '0x' + '0'.repeat(40);
const DEAD = new Set([ZERO, '0x000000000000000000000000000000000000dead']);
const MEME = ['inu', 'doge', 'shib', 'elon', 'moon', 'safe', 'baby', 'floki', 'pepe', 'rocket'];

class UserError extends Error {}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function makeClient(key) {
  const etherscan = !!key;
  const base = etherscan ? 'https://api.etherscan.io/v2/api' : 'https://eth.blockscout.com/api';
  async function get(params) {
    const q = new URLSearchParams(etherscan ? { chainid: '1', ...params, apikey: key } : params);
    let last;
    for (let attempt = 0; attempt < 6; attempt++) {
      try {
        const res = await fetch(`${base}?${q}`, { headers: { accept: 'application/json' } });
        const r = await res.json();
        last = r;
        const msg = String((r && r.message) || '') + ' ' + (typeof (r && r.result) === 'string' ? r.result : '');
        const limited = res.status === 429 || /rate limit|too many|max rate|busy/i.test(msg);
        if (!limited && r && r.result !== undefined && r.result !== null && r.error === undefined) {
          if (/No (records|transactions|logs) found/i.test(String(r.message || ''))) return [];
          if (r.status === undefined || r.status === '1' || params.module === 'proxy') return r.result;
        }
        if (!limited && r && /No (records|transactions|logs) found/i.test(String(r.message || ''))) return [];
      } catch (e) { last = String(e); }
      await sleep(700 * (attempt + 1));
    }
    throw new Error('Blockchain lookup failed: ' + JSON.stringify(last).slice(0, 200));
  }
  async function rpc(method, params) {
    if (etherscan) {
      const map = {
        eth_call: () => get({ module: 'proxy', action: 'eth_call', to: params[0].to, data: params[0].data, tag: 'latest' }),
        eth_getBlockByNumber: () => get({ module: 'proxy', action: 'eth_getBlockByNumber', tag: params[0], boolean: 'false' }),
        eth_getTransactionByHash: () => get({ module: 'proxy', action: 'eth_getTransactionByHash', txhash: params[0] }),
      };
      return map[method]();
    }
    for (let attempt = 0; attempt < 6; attempt++) {
      try {
        const res = await fetch('https://eth.blockscout.com/api/eth-rpc', {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
        });
        const r = await res.json();
        if (r.result !== undefined && r.result !== null) return r.result;
      } catch (e) { /* retry */ }
      await sleep(700 * (attempt + 1));
    }
    throw new Error('Blockchain lookup failed (' + method + ')');
  }
  return { get, rpc, provider: etherscan ? 'Etherscan' : 'Blockscout' };
}

const words = (data) => { const h = data.slice(2); const out = []; for (let i = 0; i + 64 <= h.length; i += 64) out.push(BigInt('0x' + h.slice(i, i + 64))); return out; };
const addr = (topic) => '0x' + topic.slice(-40).toLowerCase();
const pad = (a) => a.toLowerCase().replace('0x', '').padStart(64, '0');
const toEth = (big) => Number(big) / 1e18;

function textFrom(hex) {
  const h = (hex || '0x').slice(2);
  const decode = (s) => { try { return new TextDecoder().decode(Uint8Array.from(s.match(/../g) || [], (b) => parseInt(b, 16))); } catch { return ''; } };
  try {
    const n = parseInt(h.slice(64, 128), 16);
    if (h.length >= 128 && n > 0 && n < 200 && h.length >= 128 + 2 * n) return decode(h.slice(128, 128 + 2 * n));
  } catch { /* fall through */ }
  return decode(h.slice(0, 64)).replace(/\0+$/, ''); // old tokens return fixed-size text
}

// Same as the notebook's hour_one_features(row, logs, max_block)
function hourOneFeatures(wethIs0, initEth, logs, maxBlock) {
  logs = logs.filter((lg) => parseInt(lg.blockNumber, 16) <= maxBlock);
  const f = { n_swaps: 0, n_buys: 0, n_sells: 0, n_mints: 0, n_burns: 0, eth_bought: 0, eth_sold: 0, eth_in_pool_1h: NaN };
  let lpBurned = 0n, lpMinted = 0n;
  const buyers = new Set();
  for (const lg of logs) {
    const t0 = lg.topics[0].toLowerCase();
    if (t0 === TOPIC.swap) {
      const [a0in, a1in, a0out, a1out] = words(lg.data);
      const ethIn = toEth(wethIs0 ? a0in : a1in), ethOut = toEth(wethIs0 ? a0out : a1out);
      f.n_swaps += 1;
      if (ethIn > 0) { f.n_buys += 1; f.eth_bought += ethIn; buyers.add(addr(lg.topics[2])); }
      else { f.n_sells += 1; f.eth_sold += ethOut; }
    } else if (t0 === TOPIC.mint) f.n_mints += 1;
    else if (t0 === TOPIC.burn) f.n_burns += 1;
    else if (t0 === TOPIC.sync) { const [r0, r1] = words(lg.data); f.eth_in_pool_1h = toEth(wethIs0 ? r0 : r1); }
    else if (t0 === TOPIC.transfer && lg.topics.length >= 3) {
      const src = addr(lg.topics[1]), dst = addr(lg.topics[2]);
      const amount = lg.data !== '0x' ? words(lg.data)[0] : 0n;
      if (src === ZERO) lpMinted += amount; else if (DEAD.has(dst)) lpBurned += amount;
    }
  }
  f.unique_buyers = buyers.size;
  f.lp_burned_share = lpMinted > 0n ? Number(lpBurned * 1000000n / lpMinted) / 1e6 : 0;
  f.sell_buy_ratio = f.n_sells / Math.max(f.n_buys, 1);
  f.pool_change_1h = initEth ? f.eth_in_pool_1h / initEth - 1 : NaN;
  f.hit_1000_cap = logs.length >= 1000 ? 1 : 0;
  return f;
}

async function poolLogs(c, pair, fromBlock, toBlock) {
  const logs = [];
  for (let page = 1; page <= 10; page++) {
    const batch = await c.get({ module: 'logs', action: 'getLogs', address: pair, fromBlock: String(fromBlock), toBlock: String(toBlock), page: String(page), offset: '1000' });
    if (!Array.isArray(batch)) break;
    logs.push(...batch);
    if (batch.length < 1000) break;
  }
  // Blockscout returns numbers in decimal or hex depending on version: normalise to hex
  logs.forEach((lg) => {
    if (typeof lg.blockNumber === 'number' || !String(lg.blockNumber).startsWith('0x')) lg.blockNumber = '0x' + Number(lg.blockNumber).toString(16);
    lg.topics = (lg.topics || []).filter(Boolean);
  });
  logs.sort((a, b) => parseInt(a.blockNumber, 16) - parseInt(b.blockNumber, 16) || parseInt(a.logIndex || '0', 16) - parseInt(b.logIndex || '0', 16));
  return logs;
}

async function creation(c, contract) {
  const r = await c.get({ module: 'contract', action: 'getcontractcreation', contractaddresses: contract });
  const row = Array.isArray(r) ? r[0] : null;
  if (!row) throw new UserError("Couldn't find who created this contract.");
  let block = row.blockNumber ? Number(row.blockNumber) : NaN;
  if (!Number.isFinite(block)) {
    const tx = await c.rpc('eth_getTransactionByHash', [row.txHash]);
    block = parseInt(tx.blockNumber, 16);
  }
  return { creator: String(row.contractCreator).toLowerCase(), block };
}

async function liveFeatures(address, key) {
  address = String(address || '').trim().toLowerCase();
  if (!/^0x[0-9a-f]{40}$/.test(address)) throw new UserError('That is not a valid Ethereum address. It should start with 0x followed by 40 letters and numbers.');
  if (address === WETH) throw new UserError('That is Wrapped Ether itself. Paste the address of the token you want to check.');
  const c = makeClient(key);
  const call = (to, data) => c.rpc('eth_call', [{ to, data }, 'latest']);

  const pairHex = await call(FACTORY, '0xe6a43905' + pad(address) + pad(WETH)); // getPair(token, WETH)
  if (typeof pairHex !== 'string' || !pairHex.startsWith('0x') || pairHex.length < 42) throw new Error('Unexpected answer looking up the pool: ' + String(pairHex).slice(0, 80));
  const pair = addr(pairHex);
  if (BigInt(pair) === 0n) throw new UserError('We couldn\u2019t find an Ethereum Uniswap V2 pool for this token. Rug-Pull Radar checks Ethereum tokens on Uniswap for now. If this token lives on BNB Chain, Base or another chain, that\u2019s on our roadmap.');
  const [token0Hex, nameHex, symbolHex, decHex] = await Promise.all([
    call(pair, '0x0dfe1681'), call(address, '0x06fdde03'), call(address, '0x95d89b41'), call(address, '0x313ce567'),
  ]);
  const token0 = addr(token0Hex);
  const name = textFrom(nameHex), symbol = textFrom(symbolHex);
  const decimals = decHex && decHex !== '0x' ? parseInt(decHex, 16) : 18;

  const [tok, pool] = await Promise.all([creation(c, address), creation(c, pair)]);
  const b = pool.block;
  const blk = await c.rpc('eth_getBlockByNumber', ['0x' + b.toString(16), false]);
  const launched = new Date(parseInt(blk.timestamp, 16) * 1000);
  // earlier contracts deployed by the same creator (our stand-in for "tokens launched before")
  const txs = await c.get({ module: 'account', action: 'txlist', address: tok.creator, startblock: '0', endblock: String(b - 1), page: '1', offset: '1000', sort: 'asc' });
  const prior = Array.isArray(txs) ? txs.filter((t) => t.contractAddress && t.contractAddress !== '').length : 0;

  const bph = b >= MERGE_BLOCK ? LIVE_BLOCKS_PER_HOUR : OLD_BLOCKS_PER_HOUR;
  const logs = await poolLogs(c, pair, b, b + bph);
  const firstMint = logs.find((lg) => lg.topics[0].toLowerCase() === TOPIC.mint);
  if (!firstMint) throw new UserError('This pool had no liquidity added in its first hour, so there is nothing to score.');
  const [a0, a1] = words(firstMint.data);
  const wethIs0 = token0 === WETH;
  const ethAmt = wethIs0 ? a0 : a1, tokAmt = wethIs0 ? a1 : a0;
  const initEth = toEth(ethAmt);
  const tokens = Number(tokAmt) / Math.pow(10, decimals);

  const f = {
    init_liq_eth: initEth,
    log_init_tokens: Math.log10(Math.max(tokens, 1e-9)),
    decimals,
    creator_prior_tokens: prior,
    meme_word: MEME.some((w) => name.toLowerCase().includes(w)) ? 1 : 0,
    non_ascii: [...(name + symbol)].some((ch) => ch.codePointAt(0) > 127) ? 1 : 0,
    name_len: [...name].length,
    dow: (launched.getUTCDay() + 6) % 7, // Monday = 0, like pandas
    ...hourOneFeatures(wethIs0, initEth, logs, b + bph),
  };
  const hoursLive = (Date.now() - launched.getTime()) / 3.6e6;
  return { name, symbol, address, pair, launched: launched.toISOString(), hoursLive, features: f, provider: c.provider };
}

module.exports = { liveFeatures, hourOneFeatures, UserError };
