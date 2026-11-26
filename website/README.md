# Rug-Pull Radar website (rugrat.xyz)

The live site for Rug-Pull Radar, built by Raina Arora for the Veritas AI hackathon.

- `src/` is the React + Vite front end (Tailwind CSS v4, Motion).
- `api/score.js` is the one Vercel function. It looks up a token's launch facts and first hour of trades, then scores it with the XGBoost model from the notebook.
- `public/engine.js` runs the same model in the browser for the Pump Alarm and example tokens.
- `data.json` (the exported model and test tokens) is not stored here. It comes from the export cell in Part 10 of the Colab notebook and goes in `public/` before you build.

To run it locally: `npm install`, then `npm run dev`. It is deployed to Vercel and served at https://rugrat.xyz.

This project is a prototype and is not financial advice.
