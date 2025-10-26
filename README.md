# 0xProtocol Terminal

The 0xProtocol terminal is a retro CRT-inspired control surface showcasing Proof-of-AI governance, validator telemetry, resource flows, and the xLUNAR ($xLNR) markets.

## Development

```bash
cd web
npm install
npm run dev
```

Visit http://localhost:5173 (or the forwarded port) to interact with the live terminal while developing.

## Production build

Run `npm run build` inside the `web/` directory to produce an optimised production bundle.

## Preview

Review the text snapshot at
[`docs/terminal-preview.txt`](docs/terminal-preview.txt) for an ASCII walkthrough
of the terminal layout and active surfaces.

## Repository hygiene

Binary assets are intentionally excluded from version control so the workspace can
be synced with systems that restrict non-text blobs. All UI previews live in the
text snapshot above, and generated artefacts such as `package-lock.json` remain
local-only.
