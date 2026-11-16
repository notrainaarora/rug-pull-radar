# Rug-Pull Radar

**A first-hour scam check for brand-new crypto tokens, so first-time buyers can see the warning signs before they spend their money.**

> **This project is a prototype and is not financial advice.**

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/drive/1BQ9yZiHuNi4HdX_51NihZayGJDvcArsQ?usp=sharing)

**Try it live: [rugrat.xyz](https://rugrat.xyz)**. Paste any Uniswap V2 token address and get its risk score and top three reasons in about 10 seconds.

Part of the **Crypto Safety Copilot**. Built solo for the Veritas AI International High School Hackathon 2026, AI + Finance track.

## What it does
A friend or influencer posts a new token. It launched an hour ago. Should you buy?

Rug-Pull Radar takes that token and gives back:
- a **risk score** from 0 to 100,
- a **traffic light** (green, yellow, red),
- the **top three reasons** for the score, in plain English (from SHAP).

**The website** ([rugrat.xyz](https://rugrat.xyz)) does all of this in the browser. The live check runs on a small Vercel server function that reads the blockchain with Etherscan and scores the token with the same XGBoost model, exported from the notebook (Part 10). The Etherscan key stays on the server.

The notebook's Gradio demo has three tabs. In **Rug-Pull Radar** you pick a token from the test set, which the model never saw during training. You see its score and reasons, and then what actually happened to it. In **Pump Alarm** you paste a Telegram message and get an alarm score and the top words behind it (see the add-on below). In **Paste an address** you enter a live Uniswap V2 token address, and the tool rebuilds its launch and first-hour features from the public blockchain with Etherscan, then scores it.

## Why the first hour
A rug pull is when nearly all the ETH is suddenly removed from a token's trading pool. In this dataset:
- 26% of rug pulls happen within 1 hour of launch,
- 50% within 5.9 hours,
- 74% within 24 hours.

A warning tomorrow is too late. So the tool scores tokens at hour one.

## Results
**Main result, with first-hour features.** I re-measured every legit token plus 3,000 rug pulls (4,837 tokens) over their first hour using Etherscan. I split them by launch date (70% train, 15% tune, 15% test) and scored the newest 15% once.

| Model | Recall | Precision | Legit wrongly flagged | Balanced accuracy | PR-AUC |
|---|---|---|---|---|---|
| Baseline 1: "everything is a scam" | 1.00 | 0.44 | 100% | 0.50 | n/a |
| Baseline 3: "flag if no LP tokens burned in hour one" | 0.98 | 0.44 | 97% | 0.50 | n/a |
| XGBoost, launch features only (before) | 0.43 | 0.82 | 7.4% | 0.68 | 0.74 |
| **XGBoost, launch + first hour (after)** | **0.60** | **0.88** | **6.4%** | **0.77** | **0.85** |

**Earlier vs. more accurate (hour one vs six hours),** on the same test tokens:

| Model | Recall | Legit wrongly flagged | Balanced accuracy | Rug pulls still running at that hour | Share of ALL rug pulls warned in time |
|---|---|---|---|---|---|
| **Hour-one model** | 0.59 | 6.4% | 0.763 | 73% | **44%** |
| Six-hour model | 0.59 | 5.7% | 0.768 | 62% | 37% |

Waiting six hours barely improves accuracy, but by then more scams have already happened, so the hour-one model warns about more of them in time.

**Launch-only model on the full dataset** (18,344 tokens; test = Aug 15 to Nov 14, 2021, 82% rug pulls):

| Model | Recall | Precision | Legit wrongly flagged | Balanced accuracy | PR-AUC |
|---|---|---|---|---|---|
| Baseline 1: "everything is a scam" | 1.00 | 0.82 | 100% | 0.50 | n/a |
| Baseline 2: "flag if starting pool > 4 ETH" (best single rule on training data) | 0.46 | 0.87 | 31% | 0.58 | n/a |
| Logistic regression | 0.46 | 0.93 | 16% | 0.65 | 0.905 |
| XGBoost | 0.50 | 0.94 | 14% | 0.68 | 0.928 |

Accuracy is misleading here, because calling everything a scam is already 82% accurate. Balanced accuracy averages the scam catch rate and the legit pass rate, so 0.50 means no better than guessing.

**What didn't help much.** I added more name and launch features: a link in the name, symbol length, digits, a round-number ETH deposit, copycat names, and the creator's earlier known rug pulls. Balanced accuracy moved only from about 0.68 to 0.69 or 0.70, which is within noise. Launch-time data has hit its ceiling, so the next gain has to come from first-hour trading behavior.

## Failure examples and fairness
From the launch-only model, notebook Part 6d.

**Missed scams the model rated safest:**
- "NFT Rise": 33/100, rug pulled about 22 days (526 hours) after launch. Its small 0.5 ETH pool, 9 decimals, and huge token count all lowered the score.
- "FlokiX": 37/100, rug pulled about 32 days (761 hours) after launch.

These are slow rugs that look ordinary at launch. Launch-time data cannot see what the creator does weeks later.

**False alarms (legit tokens rated riskiest):**
- "Frunkpuppy": 99/100. The creator had launched 23 tokens before, and the pool started with 35 ETH.
- "Kawakami Inu": 99/100. 11 ETH pool, 18 decimals.

Serial launchers and big pools look risky to the model, even when they are honest.

**Who gets wrongly flagged, by starting pool size** (launch-only model):

| Starting pool | Legit tokens in test set | Wrongly flagged |
|---|---|---|
| Small (2 ETH or less) | 213 | 5% |
| Medium (2 to 10 ETH) | 208 | 18% |
| Large (over 10 ETH) | 69 | 30% |

So the model is not harsher on small projects. It is harsher on large ones. In this data, rug pulls started with bigger pools (median 9 ETH vs 2.5 ETH for legit tokens). Scammers in 2020 and 2021 likely seeded big pools to look trustworthy. That is a pattern in this data, not a rule for today.

## Add-on: Pump Alarm (notebook Part 8)
A second, smaller signal. Pump-and-dump groups on Telegram tell members when to buy a coin together. I trained a text classifier on 2,783 hand-labeled Telegram messages (328 pump announcements) from Hu et al., SIGMOD 2023.

| Test | Model | Precision | Recall | F1 |
|---|---|---|---|---|
| Newer messages (date split) | Keyword rule | 0.17 | 0.91 | 0.28 |
| Newer messages (date split) | TF-IDF + logistic regression | 0.81 | 0.81 | 0.81 |
| 9 channels never seen in training | Keyword rule | see notebook | see notebook | 0.20 |
| 9 channels never seen in training | TF-IDF + logistic regression | see notebook | see notebook | 0.50 |

The honest number is **F1 0.50** on unseen channels. Most false alarms are hype posts about a future pump ("Biggest Special PUMP signal coming tomorrow"), which the labels count as not a pump. Privacy: I kept only message text and date, and masked usernames, links, and phone numbers.

## How to run
1. Click **Open in Colab** above.
2. Click **Runtime → Run all**. The notebook downloads the dataset (about 13 MB) and saves it to your Google Drive.
3. Scroll to the demo section and open the Gradio link to try the tool.
4. Optional (Part 7): to rebuild the first-hour features, make a free [Etherscan](https://etherscan.io) API key and add it in Colab under **Secrets** with the name `ETHERSCAN_KEY`. Never paste the key into a cell. The fetch takes about 20 minutes.

Every code cell has a text cell above it that explains what it does and why.

## The leakage finding
The dataset comes with ready-made trading features. A model on them scored a PR-AUC of **0.99**. That was too good to be true.

The reason: the features were measured over different time windows. For rug pulls, the median window was about **1.5 hours** (up to the moment of the rug pull). For normal tokens, it was about **1,446 hours**. The model was really learning the window length, not the token's behavior. A buyer in the first hour could never see those numbers.

So I dropped them. I only use what is visible at launch, plus first-hour features that I rebuilt the same way for every token from the blockchain.

## Limitations
- **It still misses about 40% of scams** at the current threshold. A careful scammer can look normal in the first hour.
- **False alarms hurt honest projects.** 6.4% of legit tokens get wrongly flagged with first-hour features. In the launch-only model, 30% of legit tokens with large pools were. That could scare buyers away from a real project.
- **Pump Alarm is weak on new channels.** F1 drops from 0.81 to 0.50 on channels it never saw.
- **Ethereum and Uniswap V2 only.** The tokens are from 2020 and 2021. Scams change, and today many new tokens launch on other chains, which this model has never seen.
- **Labels are not perfect.** A token is labeled a rug pull if nearly all the ETH left its pool. Some of those might be a big sell-off and not the creator's fault.
- **It is not advice.** A green light does not mean a token is safe.

## What's next
- Wallet-drainer detector and NFT wash-trading detector for the Crypto Safety Copilot.
- Other chains: BNB Chain (PancakeSwap), Base and Solana. Each needs its own labeled rug-pull data and a retrained model, because pools, fees and scam patterns differ by chain.
- Newer Ethereum data, to check the model still holds up after 2021.

## Credits
- **Rug-pull data:** [RugPull-Prediction-AI](https://github.com/kangmyoungseok/RugPull-Prediction-AI) by Team BOBAI (KITRI BoB 10th, 2021). No license file is published; used for non-commercial study with credit.
- **Pump data:** Hu et al., "Sequence-based Target Coin Prediction for Cryptocurrency Pump-and-Dump," SIGMOD 2023, [Pump-and-Dump-Detection-on-Cryptocurrency](https://github.com/Bayi-Hu/Pump-and-Dump-Detection-on-Cryptocurrency). No license file is published; used for non-commercial study with credit.
- **Libraries:** pandas, NumPy, scikit-learn, XGBoost, SHAP, Gradio, matplotlib. Website: React, Vite, Tailwind CSS, Motion, Lucide icons, Geist font, hosted on Vercel.
- **APIs:** [Etherscan](https://docs.etherscan.io).
- **AI tools:** Claude (Anthropic), used as an AI coding assistant to write and debug the notebook and website code.

This project is a prototype and is not financial advice.
