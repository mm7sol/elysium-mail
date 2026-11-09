# Elysium Mail

Wallet mail for [Elysium](https://elysium.kinetiq.xyz), Kinetiq's L2 for Hyperliquid. Your wallet address is your mailbox: anyone can write to you at `0x…` or at your `.els` name, and every message is signed by the sender's wallet.

Live: https://www.elysiummail.xyz · Docs: https://www.elysiummail.xyz/docs

## Concepts

- **Wallet = identity.** No account, no password. You sign in by signing one readable sentence with your wallet. Session lasts 24h; the signature can never move funds.
- **Name = address.** A `.els` name (e.g. `maya.els`) resolves on-chain to a wallet address. People write to the name, the name resolves to the wallet.
- **Signed messages.** Each message carries a `personal_sign` signature over its exact text.

## Sign in

Open the app and click **Connect wallet & sign in**. Any EIP-1193 wallet works (Hyperliquid Wallet, MetaMask, Rabby…). The app requests your accounts, then switches/adds the Elysium chain:

| Field | Value |
|---|---|
| Chain name | Elysium |
| Chain ID | `99901` (0x1863d) |
| RPC | `https://rpc.elysium.kinetiq.xyz` |
| Native currency | HYPE (18 decimals) |
| Explorer | `https://elysium.kinetiq.xyz` |

## Identity & .els names

Your identity is your wallet address. If you own a `.els` name registered on [ELSnames](https://www.elsname.xyz/) and set it as primary, Elysium Mail resolves it on-chain and shows it instead of the raw address.

Forward resolution (name → address) and reverse resolution (address → name) go directly to the Elysium RPC via ethers.js v6. No API key required.

### ELSnames contracts (Elysium mainnet)

| Contract | Address |
|---|---|
| Registry | `0x5752aCFe755F20dc38F481829587A59a0bF5107c` |
| Resolver | `0x3ba6E08b2041A2D86BB4849369ad2f6C1B3A073E` |
| Controller | `0xAC6aa1587b715b313a1fA83c5B6aC7a91e8Ae728` |
| Reverse registrar | `0x1Bb4791eF4C29A4EdDCf958c273cE96F300aaE16` |
| USDC | `0xb47c4C8F73F009CC0C0d3f92B388d13E293F0B65` |
| Auction | `0x6220A83bFcdA5CD6E55A8AaA8B67b32a4831826d` |

Pricing (per year, paid in USDC): 5+ chars $10, 4 chars $25, 3 chars $60, 2 chars $150, 1 char sold by auction. Discounts up to 50% for Hyperliquid history. Buy/renew at https://www.elsname.xyz/app.

## Architecture

- **Static site** (HTML/CSS/JS), no backend, no build step. Served by Vercel.
- **Storage**: messages, contacts, session and identity in `localStorage` (keys prefixed `elys_`). Demo: no server-side mailbox yet.
- **On-chain reads**: `.els` resolution goes directly to the Elysium RPC via ethers.js v6, in the browser.
- **Wallet**: native EIP-1193 provider (`window.ethereum`). No Privy, no embedded wallets.

## Files

```
index.html          Landing page
app.html            Inbox application
docs.html           Documentation
css/landing.css     Landing styles (Elysium palette)
css/app.css         App styles + toast + card
js/landing.js       Landing interactions
js/app.js           App logic (folders, compose, contacts, session, identity)
js/els.js           .els resolution (forward + reverse) on Elysium
logo/               logo.png (original), logo-dark.png (512 tile), favicon.png (128)
vercel.json         cleanUrls: true
```

## Run locally

```bash
cd "elysium-mail"
npx serve .
```

Then open http://localhost:3000.

## Deploy

```bash
# preview
vercel
# production
vercel --prod
```

The project is `yugu-studio/elysium-mail` (separate from the `brainlab` project that owns `hoodmailrh.fun`).

## Current limitations

- **Messages are local.** No server-side mailbox: messages, drafts and contacts live in `localStorage`. Not synced across devices or delivered to other users.
- **Signature is simulated.** The signature shown is a deterministic hash, not a real `personal_sign`.
- **Encryption described, not implemented.** Mailboxes are not yet AES-256-GCM encrypted at rest.
- **Buying a `.els` name** happens on ELSnames, not inside this app.

## Links

- App: https://www.elysiummail.xyz
- Docs: https://www.elysiummail.xyz/docs
- ELSnames: https://www.elsname.xyz/
- Elysium: https://elysium.kinetiq.xyz
- Twitter: https://x.com/elysium_mail
