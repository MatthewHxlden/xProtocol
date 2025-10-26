import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";

type RouteKey =
  | "/sys/manifest"
  | "/validators"
  | "/blocks"
  | "/explorer"
  | "/wallet"
  | "/faucet";

const asciiFrameLines = [
  "╔════════════════════════════════════════════════════════════════════════════════╗",
  "║                             0XPROTOCOL TERMINAL v1.0.0                         ║",
  "║                    SIMULATED PROOF-OF-AI OBSERVATORY INTERFACE                 ║",
  "║                                                                                ║",
  "║ This console recreates the public-facing spectacle that once framed            ║",
  "║ 0xProtocol as a self-governing, fully autonomous blockchain. Every glyph       ║",
  "║ you see is rendered from static lore, not from a live network.                 ║",
  "║                                                                                ║",
  "║ AI VALIDATORS (THEATRICAL):                                                    ║",
  "║   ▸ SYNAPSE   ▸ HORIZON   ▸ KOSMOS   ▸ ECHO   ▸ LUMEN   ▸ MYCELIA               ║",
  "║                                                                                ║",
  "║ They never finalized blocks, never shipped RPC endpoints, and never exposed    ║",
  "║ chain IDs or genesis proofs. The original experience was an artful simulation  ║",
  "║ inspired by AsterChain’s terminal vignette.                                    ║",
  "║                                                                                ║",
  "║ experiment log: @0xprotocol                                                    ║",
  "║                                                                                ║",
  "║ ⚠ WARNING – FICTIONAL NETWORK – TELEMETRY IS LOOPED FROM CURATED NARRATIVE.    ║",
  "║    USE FOR STORYTELLING AND RESEARCH ONLY.                                     ║",
  "╚════════════════════════════════════════════════════════════════════════════════╝"
];

const routes: { path: RouteKey; label: string; description: string }[] = [
  { path: "/sys/manifest", label: "/sys/manifest", description: "dissect the mythos" },
  { path: "/validators", label: "/validators", description: "meet the personas" },
  { path: "/blocks", label: "/blocks", description: "looped production feed" },
  { path: "/explorer", label: "/explorer", description: "mock ledger artifacts" },
  { path: "/wallet", label: "/wallet", description: "non-functional shell" },
  { path: "/faucet", label: "/faucet", description: "fictional distribution" }
];

const manifestSections = [
  {
    title: "1. No chain launched",
    copy: [
      "There is no verifiable mainnet, testnet, or RPC endpoint tied to 0xProtocol.",
      "All block, balance, and validator output originated from bundled JSON used to drive the demo UI.",
      "No chain ID, genesis hash, or explorer URL was ever published beyond this theatrical terminal."
    ]
  },
  {
    title: "2. Marketing-grade numbers",
    copy: [
      "Claims such as ~400 ms block time and 100 000+ TPS were aspirational copy—no benchmarks or telemetry accompanied them.",
      "Validator commentary recycled patterned phrases, revealing procedurally-generated text rather than organic network chatter.",
      "Cloud-hosted AI models (Claude-3, GPT, Groq) cannot deterministically co-run consensus, yet they were listed as validator cores."
    ]
  },
  {
    title: "3. What actually existed",
    copy: [
      "An interactive story layer that let visitors click around fabricated explorer routes, faux wallets, and faucet prompts.",
      "A retro terminal aesthetic cribbed from late-90s CRTs blended with modern CSS animation to deliver immersion.",
      "Lore positioning 0xProtocol as an AI-governed commonwealth—compelling speculative fiction, not shipped infrastructure."
    ]
  },
  {
    title: "4. Why it matters",
    copy: [
      "Despite being fictional, the prototype popularized agent-based governance ideas now surfacing across the ecosystem.",
      "It acts as a narrative scaffold for future experiments: how could autonomous validators argue, reconcile, and explain decisions?"
    ]
  }
];

const validatorAgents = [
  {
    id: "SYNAPSE",
    role: "Consensus dramaturge",
    persona: "Translates probabilistic outputs into narrativized block summaries.",
    uptime: "88%",
    status: "looped"
  },
  {
    id: "HORIZON",
    role: "Latency diviner",
    persona: "Forecasts inter-shard gossip windows using imaginary celestial charts.",
    uptime: "92%",
    status: "looped"
  },
  {
    id: "KOSMOS",
    role: "Ethics auditor",
    persona: "Quotes simulated civic charters whenever proposed intents clash.",
    uptime: "77%",
    status: "looped"
  },
  {
    id: "ECHO",
    role: "Telemetry mimic",
    persona: "Repeats archived validator debates with subtly altered cadence.",
    uptime: "84%",
    status: "looped"
  },
  {
    id: "LUMEN",
    role: "Alignment scribe",
    persona: "Annotates fictional XUR (0xProtocol Upgrade Record) footnotes in neon margins.",
    uptime: "81%",
    status: "looped"
  },
  {
    id: "MYCELIA",
    role: "Mesh weaver",
    persona: "Spawns new validator aliases on demand to imply organic growth.",
    uptime: "99%",
    status: "looped"
  }
];

const blockStream = [
  {
    height: "#185,334",
    producer: "SYNAPSE",
    tps: "98 421",
    latency: "0.41 s",
    commentary: "Synthesized 32 intents. Declared \"collective empathy\" as consensus basis."
  },
  {
    height: "#185,335",
    producer: "HORIZON",
    tps: "101 223",
    latency: "0.39 s",
    commentary: "Forecast jitter ±0.02 s. Triggered holographic validator caucus replay."
  },
  {
    height: "#185,336",
    producer: "ECHO",
    tps: "97 002",
    latency: "0.40 s",
    commentary: "Injected familiar transaction cadence. Audience engagement +14%."
  },
  {
    height: "#185,337",
    producer: "KOSMOS",
    tps: "100 778",
    latency: "0.42 s",
    commentary: "Flagged ethical drift, requested imaginary quorum reconsideration."
  },
  {
    height: "#185,338",
    producer: "MYCELIA",
    tps: "102 114",
    latency: "0.38 s",
    commentary: "Spawned validator alias NIX to maintain mystique around expansion."
  }
];

const explorerAddresses = [
  {
    label: "treasury://civic",
    address: "0xF1C710N-0000-0000-0000-000000000001",
    balance: "1 024 000.0000 XLORE",
    notes: "Static JSON payload powering the \"community grants\" table."
  },
  {
    label: "validator://synapse",
    address: "0xSYN-4P53-4I-REND3R-0000000002",
    balance: "512 128.4488 XLORE",
    notes: "Used to loop signature glyphs beside block feed entries."
  },
  {
    label: "citizen://kez",
    address: "0xC1V1C-PR0MPT-0000-0000-0000000042",
    balance: "42.0420 XLORE",
    notes: "A friendly cameo referencing archived proposal threads."
  }
];

const walletShortcuts = [
  "press [l] to attempt login",
  "press [g] to generate mock address",
  "press [d] to drop signed intent"
];

const faucetDrips = [
  {
    label: "Cycle 01",
    status: "queued",
    detail: "Faucet awaited captcha that never shipped."
  },
  {
    label: "Cycle 02",
    status: "stalled",
    detail: "AI steward requested compliance review of fictional liquidity."
  },
  {
    label: "Cycle 03",
    status: "retired",
    detail: "Landing page sunset before faucet script deployed."
  }
];

const commandLogScript = [
  {
    actor: "system",
    message: "Bootstrapping 0xProtocol terminal skin..."
  },
  {
    actor: "observer",
    message: "Remember: every validator personality is dramaturgy, not validator set."
  },
  {
    actor: "system",
    message: "Streaming block heights from cached sequence [185,334–185,338]."
  },
  {
    actor: "synth",
    message: "Injected commentary line: 'Consensus anchored in empathy gradients.'"
  },
  {
    actor: "auditor",
    message: "No RPC handshake detected. Operating in simulation-only mode."
  },
  {
    actor: "custodian",
    message: "Wallet shell warns: signing functions disabled to prevent confusion."
  },
  {
    actor: "curator",
    message: "Explorer addresses cross-reference static narrative ledger."
  },
  {
    actor: "system",
    message: "Looping faucet drip statuses from archived asterchain.pro capture."
  }
];

export default function App() {
  const [activeRoute, setActiveRoute] = useState<RouteKey>("/sys/manifest");
  const [commandBuffer, setCommandBuffer] = useState(commandLogScript.slice(0, 4));
  const commandCursor = useRef(4);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCommandBuffer((prev) => {
        const next = commandLogScript[commandCursor.current % commandLogScript.length];
        commandCursor.current = (commandCursor.current + 1) % commandLogScript.length;
        return [...prev.slice(-7), next];
      });
    }, 4200);

    return () => window.clearInterval(interval);
  }, []);

  const blockLoop = useMemo(() => blockStream.concat(blockStream.slice(0, 2)), []);

  return (
    <div className="crt-shell terminal-shell">
      <div className="scanline-overlay" aria-hidden />
      <header className="terminal-panel">
        <div className="terminal-status">
          <span className="status-led" aria-hidden />
          <span>0xProtocol.sys</span>
          <span className="status-clock">{new Date().toUTCString()}</span>
        </div>
        <motion.pre
          className="ascii-frame"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          aria-label="0xProtocol terminal preface"
        >
          {asciiFrameLines.join("\n")}
        </motion.pre>
      </header>

      <section className="terminal-body">
        <nav className="terminal-nav" aria-label="terminal routes">
          {routes.map((route) => (
            <button
              key={route.path}
              className={clsx("nav-link", { active: activeRoute === route.path })}
              onClick={() => setActiveRoute(route.path)}
            >
              <span className="command-label">{route.label}</span>
              <span className="command-hint">{route.description}</span>
            </button>
          ))}
        </nav>

        <aside className="command-feed" aria-live="polite" aria-label="system feed">
          <h2>/feed/logs</h2>
          <AnimatePresence mode="popLayout">
            {commandBuffer.map((entry, index) => (
              <motion.div
                key={`${entry.actor}-${index}-${entry.message}`}
                className="feed-line"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.25 }}
              >
                <span className="feed-actor">[{entry.actor}]</span>
                <span className="feed-message">{entry.message}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </aside>

        <AnimatePresence mode="wait">
          <motion.section
            key={activeRoute}
            className="route-panel"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.28 }}
          >
            {activeRoute === "/sys/manifest" && (
              <div className="route-content">
                <h2>/sys/manifest</h2>
                <p className="route-intro">
                  Manifest for the 0xProtocol showcase: a candid breakdown of what the experience really delivered, beyond the
                  theatrical marketing language.
                </p>
                <div className="manifest-grid">
                  {manifestSections.map((section) => (
                    <article key={section.title} className="manifest-card">
                      <h3>{section.title}</h3>
                      <ul>
                        {section.copy.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {activeRoute === "/validators" && (
              <div className="route-content">
                <h2>/validators</h2>
                <p className="route-intro">
                  Meet the AI personas that populated the original feed. They are narrative devices looping dialogue and faux
                  telemetry to suggest an autonomous council.
                </p>
                <div className="validator-grid">
                  {validatorAgents.map((agent) => (
                    <article key={agent.id} className="validator-card">
                      <header>
                        <h3>{agent.id}</h3>
                        <span className="badge">{agent.status}</span>
                      </header>
                      <dl>
                        <div>
                          <dt>Role</dt>
                          <dd>{agent.role}</dd>
                        </div>
                        <div>
                          <dt>Persona</dt>
                          <dd>{agent.persona}</dd>
                        </div>
                        <div>
                          <dt>Uptime</dt>
                          <dd>{agent.uptime}</dd>
                        </div>
                      </dl>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {activeRoute === "/blocks" && (
              <div className="route-content">
                <h2>/blocks</h2>
                <p className="route-intro">
                  The block explorer stream that mesmerized visitors. Every entry below loops from a short cache to fabricate an
                  endless production cadence.
                </p>
                <div className="block-feed">
                  {blockLoop.map((block) => (
                    <div key={block.height + block.producer} className="block-card">
                      <header>
                        <span className="block-height">{block.height}</span>
                        <span className="block-producer">proposer {block.producer}</span>
                      </header>
                      <div className="block-metrics">
                        <span>{block.tps} pseudo-TPS</span>
                        <span>{block.latency} latency</span>
                      </div>
                      <p>{block.commentary}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeRoute === "/explorer" && (
              <div className="route-content">
                <h2>/explorer</h2>
                <p className="route-intro">
                  Faux ledger artifacts providing the illusion of an operational economy. Addresses follow playful prefixes and
                  balances remain immutable props.
                </p>
                <table className="explorer-table">
                  <thead>
                    <tr>
                      <th scope="col">Label</th>
                      <th scope="col">Address</th>
                      <th scope="col">Balance</th>
                      <th scope="col">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {explorerAddresses.map((entry) => (
                      <tr key={entry.address}>
                        <th scope="row">{entry.label}</th>
                        <td>{entry.address}</td>
                        <td>{entry.balance}</td>
                        <td>{entry.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeRoute === "/wallet" && (
              <div className="route-content">
                <h2>/wallet</h2>
                <p className="route-intro">
                  An interactive husk meant to convince visitors they could manage assets. Inputs accept keystrokes, but nothing is
                  broadcast or signed.
                </p>
                <form className="wallet-form" aria-describedby="wallet-disclaimer">
                  <label htmlFor="wallet-handle">alias</label>
                  <input id="wallet-handle" name="wallet-handle" placeholder="citizen://guest" disabled />

                  <label htmlFor="wallet-private">private key</label>
                  <input id="wallet-private" name="wallet-private" placeholder="••••••••••" disabled />

                  <label htmlFor="wallet-amount">amount</label>
                  <input id="wallet-amount" name="wallet-amount" placeholder="0.0000 XLORE" disabled />

                  <fieldset>
                    <legend>terminal shortcuts</legend>
                    <ul>
                      {walletShortcuts.map((shortcut) => (
                        <li key={shortcut}>{shortcut}</li>
                      ))}
                    </ul>
                  </fieldset>

                  <button type="button" disabled>
                    execute transfer
                  </button>
                </form>
                <p id="wallet-disclaimer" className="route-intro disclaimer">
                  Signing routines are intentionally disabled. This terminal never connected to a wallet provider, safeguarding
                  visitors from misinterpreting the fiction as a functional dApp.
                </p>
              </div>
            )}

            {activeRoute === "/faucet" && (
              <div className="route-content">
                <h2>/faucet</h2>
                <p className="route-intro">
                  Supposed to dispense demo tokens, the faucet instead cycled through placeholder statuses. Each drip call-to-action
                  referenced roadmap steps that never materialized.
                </p>
                <div className="faucet-grid">
                  {faucetDrips.map((drip) => (
                    <article key={drip.label} className="faucet-card">
                      <header>
                        <span className="faucet-label">{drip.label}</span>
                        <span className={clsx("faucet-status", drip.status)}>{drip.status}</span>
                      </header>
                      <p>{drip.detail}</p>
                    </article>
                  ))}
                </div>
                <p className="route-intro disclaimer">
                  The faucet endpoint triggered a JavaScript toast promising tokens “soon™.” It was never wired to distribute value—
                  a playful reminder that the entire 0xProtocol saga is storytelling.
                </p>
              </div>
            )}
          </motion.section>
        </AnimatePresence>
      </section>

      <footer className="terminal-footer">
        <p>© {new Date().getFullYear()} 0xProtocol — simulated autonomous commons, archived for inspiration.</p>
      </footer>
    </div>
  );
}
