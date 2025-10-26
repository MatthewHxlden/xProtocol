import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";

const TOKEN_NAME = "xLUNAR";
const TOKEN_TICKER = "$xLNR";

type PhantomEvent = "connect" | "disconnect" | "accountChanged";

interface PhantomPublicKey {
  toString(): string;
}

interface PhantomProvider {
  isPhantom?: boolean;
  publicKey?: PhantomPublicKey;
  connect: (options?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: PhantomPublicKey }>;
  disconnect: () => Promise<void>;
  on?: (event: PhantomEvent, handler: (publicKey: PhantomPublicKey) => void) => void;
  off?: (event: PhantomEvent, handler: (publicKey: PhantomPublicKey) => void) => void;
}

declare global {
  interface Window {
    solana?: PhantomProvider;
  }
}

type RouteKey =
  | "/sys/manifest"
  | "/validators"
  | "/blocks"
  | "/explorer"
  | "/wallet"
  | "/faucet"
  | "/markets";

type CommandEntry = {
  actor: string;
  message: string;
};

type BlockEntry = {
  height: number;
  producer: string;
  tps: number;
  latency: number;
  txCount: number;
  hash: string;
  commentary: string;
  timestamp: string;
};

type LedgerEntry = {
  id: string;
  hash: string;
  from: string;
  to: string;
  amount: number;
  memo?: string;
  status: "confirmed" | "pending";
  timestamp: string;
  origin: "wallet" | "faucet";
};

type FaucetEntry = {
  id: string;
  amount: number;
  to: string;
  timestamp: string;
  status: "completed" | "pending";
};

type CandleEntry = {
  id: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  buyers: number;
  sellers: number;
  holders: number;
  timestamp: string;
};

const asciiFrameLines = [
  "╔════════════════════════════════════════════════════════════════════════════════╗",
  "║                             0XPROTOCOL TERMINAL v2.3.7                         ║",
  "║                 PROOF-OF-AI CONSENSUS CONTROL & OBSERVABILITY                  ║",
  "║                                                                                ║",
  "║ Autonomous validator collective supervising settlement, execution, and         ║",
  "║ governance. All telemetry streamed from live federation endpoints.             ║",
  "║                                                                                ║",
  "║ AI VALIDATORS:                                                                 ║",
  "║   ▸ SYNAPSE   ▸ HORIZON   ▸ KOSMOS   ▸ ECHO   ▸ LUMEN   ▸ MYCELIA               ║",
  "║                                                                                ║",
  "║ Each agent negotiates upgrades, posts attestations, and signs rollup outputs.  ║",
  "║ Operators monitor the surface for block cadences, ledger changes, and wallet   ║",
  "║ events across the 0xProtocol commons.                                          ║",
  "║                                                                                ║",
  "║ access: @0xprotocol                                                            ║",
  "║                                                                                ║",
  "║ ⚡ WARNING – HIGH-THROUGHPUT SYSTEM – RESPONSES ARRIVE IN SUB-SECOND WINDOWS.   ║",
  "║    AUTHORISED USERS ONLY.                                                      ║",
  "╚════════════════════════════════════════════════════════════════════════════════╝"
];

const routes: { path: RouteKey; label: string; description: string }[] = [
  { path: "/sys/manifest", label: "/sys/manifest", description: "network overview" },
  { path: "/validators", label: "/validators", description: "validator roster" },
  { path: "/blocks", label: "/blocks", description: "live block feed" },
  { path: "/explorer", label: "/explorer", description: "ledger + registry" },
  { path: "/markets", label: "/markets", description: "xLUNAR markets" },
  { path: "/wallet", label: "/wallet", description: "manage account" },
  { path: "/faucet", label: "/faucet", description: "claim resources" }
];

const validatorAgents = [
  {
    id: "SYNAPSE",
    role: "Lead sequencer",
    persona: "Optimises rollup slots and orchestrates finality checkpoints.",
    uptime: "99.2%",
    status: "active"
  },
  {
    id: "HORIZON",
    role: "Latency diviner",
    persona: "Balances inter-shard gossip and forecasts congestion windows.",
    uptime: "98.4%",
    status: "active"
  },
  {
    id: "KOSMOS",
    role: "Ethics auditor",
    persona: "Evaluates proposals for governance and compliance alignment.",
    uptime: "96.7%",
    status: "attesting"
  },
  {
    id: "ECHO",
    role: "Telemetry relay",
    persona: "Streams attestations and notarises cross-domain receipts.",
    uptime: "97.8%",
    status: "active"
  },
  {
    id: "LUMEN",
    role: "Alignment scribe",
    persona: "Publishes upgrade records and maintains citizen-readable logs.",
    uptime: "95.9%",
    status: "syncing"
  },
  {
    id: "MYCELIA",
    role: "Mesh expander",
    persona: "Spawns sovereign rollups and provisions new validator replicas.",
    uptime: "99.7%",
    status: "active"
  }
];

const explorerAddresses = [
  {
    label: "treasury://ecosystem",
    address: "0x7E6fD42017b1105CFdf0f45C11a2dD67a4028C11",
    balance: "1 024 512.4488 xLUNAR",
    notes: "Ecosystem runway and grant allocations streamed quarterly in $xLNR."
  },
  {
    label: "validator://synapse",
    address: "0xa90EE72fDc4a8216584B671781976d74C4B9Ab62",
    balance: "512 128.2234 xLUNAR",
    notes: "Sequencer collateral locked for epoch rotation."
  },
  {
    label: "citizen://kez",
    address: "0x59c4b7E7b119c6908E9A6E106D05b98B193cA3Db",
    balance: "42.0420 xLUNAR",
    notes: "Community delegate participating in protocol votes."
  }
];

const walletShortcuts = [
  "press [g] to generate a fresh address",
  "press [t] to focus the transfer amount",
  "press [p] to connect Phantom",
  "press [f] to jump to faucet claims"
];

const commandLogScript: CommandEntry[] = [
  { actor: "system", message: "Boot sequence complete. 0xProtocol control surface online." },
  { actor: "net", message: "Validator handshake confirmed across all six AI operators." },
  { actor: "metrics", message: "Stabilised throughput baseline at 94,000 TPS." },
  { actor: "scheduler", message: "Sequencer rotation seeded from epoch 518." },
  { actor: "blocks", message: "Monitoring finality within a 0.4s window." },
  { actor: "markets", message: "xLUNAR 5m market desk syncing to /markets route." },
  { actor: "wallet", message: "Wallet shell ready for transfers and faucet claims." },
  { actor: "explorer", message: "Ledger registry indexed and available for queries." }
];

const blockCommentaryPool = [
  "Validator caucus ratified AI-governed governance slate for epoch +1.",
  "Bridged intents from sovereign rollups synced without contention.",
  "Dynamic fee curves flattened latency spikes across execution shards.",
  "Attestation quorum renewed AI alignment directives for community vault.",
  "Rollup aggregator posted compressed proofs to the settlement bridge.",
  "Sovereign appchain opt-in completed with deterministic replay checks.",
  "Citizenship staking set unlocked an additional validator delegate.",
  "Oracle mesh streamed macro metrics for AI monetary policy tuning.",
  "Validator rotation triggered a new conversational governance round."
];

const initialLedger: LedgerEntry[] = [
  {
    id: "tx-1",
    hash: "0x8f3fad9bc2ab394f271d3cc61aa58cc0fe19d2c3a1dd8e7fd1b49ab7c2c3b45",
    from: "0x7E6fD42017b1105CFdf0f45C11a2dD67a4028C11",
    to: "0x59c4b7E7b119c6908E9A6E106D05b98B193cA3Db",
    amount: 1250.4821,
    memo: "community grants disbursement",
    status: "confirmed",
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    origin: "wallet"
  },
  {
    id: "tx-2",
    hash: "0x5a4d2ef11bcd1771ab2cd9080c1fa5447d92d736ffa190ab6732c1dd8ea45f21",
    from: "0xa90EE72fDc4a8216584B671781976d74C4B9Ab62",
    to: "0x7E6fD42017b1105CFdf0f45C11a2dD67a4028C11",
    amount: 32000,
    memo: "epoch collateral refresh",
    status: "confirmed",
    timestamp: new Date(Date.now() - 1000 * 60 * 28).toISOString(),
    origin: "wallet"
  },
  {
    id: "tx-3",
    hash: "0xc27e19fd01b4e9ab1cc08df73102a671ed8fbc201c5a8d7c3b71a9ef005c44a1",
    from: "0x000000000000000000000000000000000000000F",
    to: "0xa90EE72fDc4a8216584B671781976d74C4B9Ab62",
    amount: 4800.75,
    memo: "validator performance incentive",
    status: "confirmed",
    timestamp: new Date(Date.now() - 1000 * 60 * 11).toISOString(),
    origin: "faucet"
  }
];

const BASE_HEIGHT = 392410;

const randomFrom = <T,>(collection: readonly T[]): T =>
  collection[Math.floor(Math.random() * collection.length)];

const randomBetween = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const randomHex = (length: number): string => {
  let output = "";
  for (let index = 0; index < length; index += 1) {
    output += Math.floor(Math.random() * 16).toString(16);
  }
  return output;
};

const shortHash = (hash: string): string =>
  `${hash.slice(0, 10)}…${hash.slice(-6)}`;

const formatAmount = (value: number): string =>
  value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 });

const formatTime = (iso: string): string =>
  new Date(iso).toLocaleTimeString("en-US", { hour12: false });

const formatSigned = (value: number, fractionDigits = 2): string => {
  const fixed = value.toFixed(fractionDigits);
  return value >= 0 ? `+${fixed}` : fixed;
};

const CANDLE_INTERVAL_MS = 5000;
const CANDLE_WINDOW_MINUTES = 5;

const buildCandle = (
  previous: CandleEntry | null,
  timestamp: Date,
  indexSeed = 0
): CandleEntry => {
  const open = previous ? previous.close : 12.4 + Math.random() * 0.4;
  const bullishBias = 0.001 + Math.random() * 0.005;
  const correction = Math.random() < 0.25 ? Math.random() * 0.002 : 0;
  const close = Number((open * (1 + bullishBias - correction)).toFixed(4));
  const high = Number((Math.max(open, close) + Math.random() * 0.25).toFixed(4));
  const low = Number((Math.min(open, close) - Math.random() * 0.18).toFixed(4));
  const baseBuyers = previous?.buyers ?? 1880;
  const baseSellers = previous?.sellers ?? 640;
  const baseHolders = previous?.holders ?? 24800;
  const buyers = baseBuyers + randomBetween(18, 52) + (indexSeed % 3);
  const sellers = Math.max(baseSellers + randomBetween(-8, 24), 540);
  const holders = baseHolders + randomBetween(28, 96);
  const volume = randomBetween(4100, 7200) + Math.random() * 320;
  return {
    id: `candle-${timestamp.getTime()}-${indexSeed}`,
    open,
    high,
    low,
    close,
    volume: Number(volume.toFixed(2)),
    buyers,
    sellers,
    holders,
    timestamp: timestamp.toISOString()
  };
};

const seedCandles = (): CandleEntry[] => {
  const candles: CandleEntry[] = [];
  for (let index = 0; index < 24; index += 1) {
    const minutesAgo = (23 - index) * CANDLE_WINDOW_MINUTES;
    const timestamp = new Date(Date.now() - minutesAgo * 60_000);
    const candle = buildCandle(candles[index - 1] ?? null, timestamp, index);
    candles.push(candle);
  }
  return candles;
};

const buildBlock = (height: number, date = new Date()): BlockEntry => {
  const producer = randomFrom(validatorAgents).id;
  const latency = randomBetween(320, 460) / 1000;
  const tps = randomBetween(88000, 112000);
  const txCount = randomBetween(1800, 2600);
  return {
    height,
    producer,
    tps,
    latency,
    txCount,
    hash: `0x${randomHex(64)}`,
    commentary: randomFrom(blockCommentaryPool),
    timestamp: date.toISOString()
  };
};

export default function App() {
  const [activeRoute, setActiveRoute] = useState<RouteKey>("/sys/manifest");
  const [blocks, setBlocks] = useState<BlockEntry[]>(() => {
    const now = Date.now();
    return Array.from({ length: 6 }, (_, index) =>
      buildBlock(BASE_HEIGHT - index, new Date(now - index * 5200))
    );
  });
  const blockHeightRef = useRef(blocks[0]?.height ?? BASE_HEIGHT);

  const [candles, setCandles] = useState<CandleEntry[]>(() => seedCandles());

  const [ledger, setLedger] = useState<LedgerEntry[]>(initialLedger);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [walletRecipient, setWalletRecipient] = useState<string>("");
  const [walletAmount, setWalletAmount] = useState<string>("0.0000");
  const [walletMemo, setWalletMemo] = useState<string>("");
  const [walletFeedback, setWalletFeedback] = useState<string | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);

  const [phantomAvailable, setPhantomAvailable] = useState<boolean>(false);
  const [phantomAddress, setPhantomAddress] = useState<string | null>(null);
  const [phantomConnecting, setPhantomConnecting] = useState(false);
  const [phantomError, setPhantomError] = useState<string | null>(null);

  const [faucetHistory, setFaucetHistory] = useState<FaucetEntry[]>([]);
  const [isFaucetPending, setIsFaucetPending] = useState(false);

  const [commandBuffer, setCommandBuffer] = useState<CommandEntry[]>(
    commandLogScript.slice(0, 4)
  );
  const commandCursor = useRef(4);

  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const appendCommand = useCallback((actor: string, message: string) => {
    setCommandBuffer((prev) => [...prev.slice(-7), { actor, message }]);
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const next = commandLogScript[commandCursor.current % commandLogScript.length];
      commandCursor.current = (commandCursor.current + 1) % commandLogScript.length;
      setCommandBuffer((prev) => [...prev.slice(-7), next]);
    }, 6200);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      blockHeightRef.current += 1;
      const block = buildBlock(blockHeightRef.current);
      setBlocks((prev) => [block, ...prev.slice(0, 5)]);
      appendCommand(
        "blocks",
        `height ${block.height.toLocaleString()} finalised by ${block.producer}`
      );
    }, 5800);

    return () => window.clearInterval(interval);
  }, [appendCommand]);

  useEffect(() => {
    if (blocks[0]) {
      blockHeightRef.current = Math.max(blockHeightRef.current, blocks[0].height);
    }
  }, [blocks]);

  useEffect(() => {
    if (!copiedAddress) return;
    const timeout = window.setTimeout(() => setCopiedAddress(null), 2000);
    return () => window.clearTimeout(timeout);
  }, [copiedAddress]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCandles((previousCandles) => {
        const latest = previousCandles[previousCandles.length - 1] ?? null;
        const next = buildCandle(latest, new Date(), previousCandles.length + 1);
        const nextCandles = [...previousCandles.slice(-23), next];
        appendCommand(
          "markets",
          `5m candle ${next.id.split("-").at(-1)} closed ${next.close.toFixed(4)} ${TOKEN_TICKER} (buyers ${next.buyers})`
        );
        return nextCandles;
      });
    }, CANDLE_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [appendCommand]);

  useEffect(() => {
    const provider = window.solana;
    if (!provider || !provider.isPhantom) {
      setPhantomAvailable(false);
      return;
    }

    setPhantomAvailable(true);

    const syncPublicKey = (publicKey: PhantomPublicKey | undefined) => {
      const key = publicKey?.toString?.() ?? provider.publicKey?.toString?.();
      if (key) {
        setPhantomAddress(key);
        setWalletAddress(key);
        setWalletBalance((prev) => (prev === 0 ? 640.42 : prev));
        setWalletFeedback(`Phantom connected: ${key.slice(0, 10)}…${key.slice(-6)} now active.`);
        appendCommand("wallet", `linked Phantom ${key.slice(0, 10)}…${key.slice(-6)}`);
      }
    };

    const handleConnect = (publicKey?: PhantomPublicKey) => {
      syncPublicKey(publicKey);
      setPhantomError(null);
    };

    const handleDisconnect = () => {
      setPhantomAddress(null);
      setWalletFeedback("Phantom disconnected from the terminal session.");
      appendCommand("wallet", "phantom session disconnected");
    };

    provider.on?.("connect", handleConnect);
    provider.on?.("disconnect", handleDisconnect);

    provider.connect({ onlyIfTrusted: true }).then(({ publicKey }) => {
      syncPublicKey(publicKey);
    }).catch(() => {
      // ignore silent rejection when not yet trusted
    });

    return () => {
      provider.off?.("connect", handleConnect);
      provider.off?.("disconnect", handleDisconnect);
    };
  }, [appendCommand]);

  const firstRouteChange = useRef(true);
  useEffect(() => {
    if (firstRouteChange.current) {
      firstRouteChange.current = false;
      return;
    }
    appendCommand("ui", `navigated to ${activeRoute}`);
  }, [activeRoute, appendCommand]);

  const networkStats = useMemo(() => {
    const latestHeight = blocks[0]?.height ?? BASE_HEIGHT;
    const avgLatency =
      blocks.reduce((acc, block) => acc + block.latency, 0) / (blocks.length || 1);
    const avgTps = blocks.reduce((acc, block) => acc + block.tps, 0) / (blocks.length || 1);
    const totalTransactions = ledger.length;
    const totalVolume = ledger.reduce((acc, tx) => acc + tx.amount, 0);
    return {
      latestHeight,
      avgLatency,
      avgTps,
      totalTransactions,
      totalVolume,
      faucetCount: faucetHistory.length
    };
  }, [blocks, ledger, faucetHistory]);

  const marketStats = useMemo(() => {
    const latest = candles[candles.length - 1];
    const previous = candles[candles.length - 2] ?? latest;
    const sessionOpen = candles[0]?.open ?? latest.open;
    const priceChange = latest.close - previous.close;
    const changePercent = previous.close ? (priceChange / previous.close) * 100 : 0;
    const sessionChange = latest.close - sessionOpen;
    const sessionChangePercent = sessionOpen ? (sessionChange / sessionOpen) * 100 : 0;
    const buyersDelta = latest.buyers - (previous?.buyers ?? latest.buyers);
    const sellersDelta = latest.sellers - (previous?.sellers ?? latest.sellers);
    const holdersDelta = latest.holders - (previous?.holders ?? latest.holders);
    const rollingVolume = candles.reduce((acc, entry) => acc + entry.volume, 0);
    return {
      latest,
      previous,
      priceChange,
      changePercent,
      sessionChangePercent,
      buyersDelta,
      sellersDelta,
      holdersDelta,
      rollingVolume
    };
  }, [candles]);

  const chartMetrics = useMemo(() => {
    if (candles.length === 0) {
      return {
        min: 0,
        max: 1,
        width: 760,
        height: 240,
        padding: 24,
        xUnit: 24,
        candleWidth: 8
      };
    }

    const min = Math.min(...candles.map((entry) => entry.low));
    const max = Math.max(...candles.map((entry) => entry.high));
    const width = 760;
    const height = 240;
    const padding = 24;
    const xUnit = (width - padding * 2) / Math.max(candles.length - 1, 1);
    const candleWidth = Math.max(6, xUnit * 0.5);

    return { min, max, width, height, padding, xUnit, candleWidth };
  }, [candles]);

  const priceRange = Math.max(chartMetrics.max - chartMetrics.min, 0.0001);
  const mapX = useCallback(
    (index: number) => chartMetrics.padding + index * chartMetrics.xUnit,
    [chartMetrics.padding, chartMetrics.xUnit]
  );
  const mapY = useCallback(
    (value: number) =>
      chartMetrics.height -
      ((value - chartMetrics.min) / priceRange) * (chartMetrics.height - chartMetrics.padding * 2) -
      chartMetrics.padding,
    [chartMetrics.height, chartMetrics.min, chartMetrics.padding, priceRange]
  );

  const manifestCards = useMemo(
    () => [
      {
        title: "1. Proof-of-AI finality",
        copy: [
          `Latest height ${networkStats.latestHeight.toLocaleString()} achieved with a ${networkStats.avgLatency.toFixed(
            2
          )}s median latency.`,
          `${validatorAgents.length} validator agents maintain consensus and publish checkpoints across the mesh.`,
          "Sequencer rotation ensures determinism even as conversational governance evolves each epoch."
        ]
      },
      {
        title: "2. Throughput & settlement",
        copy: [
          `Average throughput currently ${Math.round(networkStats.avgTps).toLocaleString()} transactions per second across execution shards.`,
          "Rollup proofs settle back to the L1 bridge within milliseconds thanks to predictive scheduling.",
          "Cross-domain receipts propagate through the oracle mesh for composable interop."
        ]
      },
      {
        title: "3. Ledger governance",
        copy: [
          `${networkStats.totalTransactions} tracked ledger events recorded in this session, spanning treasury, validator, and citizen activity.`,
          `Protocol treasury now manages ${formatAmount(networkStats.totalVolume)} ${TOKEN_NAME} (${TOKEN_TICKER}) of routed value in the last window.`,
          "Delegated citizens co-author proposals that validators enforce on-chain."
        ]
      },
      {
        title: "4. Resource flow",
        copy: [
          `${networkStats.faucetCount} faucet disbursement${networkStats.faucetCount === 1 ? "" : "s"} processed since boot.`,
          "Wallet shell exposes signing, memo, and balance adjustments for rapid prototyping.",
          "Stake-weighted faucet ensures research teams can prototype without friction."
        ]
      }
    ],
    [networkStats]
  );

  const handlePhantomConnect = useCallback(async () => {
    const provider = window.solana;
    if (!provider || !provider.isPhantom) {
      setPhantomError("Phantom wallet not detected. Install the extension to continue.");
      appendCommand("wallet", "phantom extension missing");
      return;
    }

    try {
      setPhantomConnecting(true);
      const response = await provider.connect();
      const key = response.publicKey?.toString?.() ?? provider.publicKey?.toString?.();
      if (key) {
        setPhantomAddress(key);
        setWalletAddress(key);
        setWalletBalance((prev) => (prev === 0 ? 640.42 : prev));
        setWalletFeedback(`Phantom connected: ${key.slice(0, 10)}…${key.slice(-6)} now active.`);
        setWalletError(null);
        appendCommand("wallet", `connected Phantom ${key.slice(0, 10)}…${key.slice(-6)}`);
      }
      setPhantomError(null);
    } catch (error) {
      setPhantomError(
        error instanceof Error ? error.message : "Phantom connection request was rejected."
      );
      appendCommand("wallet", "phantom connection rejected");
    } finally {
      setPhantomConnecting(false);
    }
  }, [appendCommand]);

  const handlePhantomDisconnect = useCallback(async () => {
    const provider = window.solana;
    if (!provider || !provider.isPhantom) {
      return;
    }
    try {
      await provider.disconnect();
      setPhantomAddress(null);
      setWalletFeedback("Phantom disconnected from the terminal session.");
      appendCommand("wallet", "phantom session disconnected");
      setPhantomError(null);
    } catch (error) {
      setPhantomError(
        error instanceof Error ? error.message : "Unable to terminate Phantom session."
      );
    }
  }, [appendCommand]);

  const handleGenerateWallet = useCallback(() => {
    const address = `0x${randomHex(40)}`;
    setWalletAddress(address);
    setWalletBalance(512.5);
    setWalletFeedback(
      `Generated address ${address.slice(0, 10)}…${address.slice(-6)} with 512.50 ${TOKEN_NAME} balance.`
    );
    setWalletError(null);
    appendCommand("wallet", `generated wallet ${address.slice(0, 10)}…${address.slice(-6)}`);
  }, [appendCommand]);

  const handleWalletSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!walletAddress) {
        setWalletError("Generate a wallet address before broadcasting a transfer.");
        setWalletFeedback(null);
        return;
      }

      const parsedAmount = Number(walletAmount.replace(/,/g, ""));
      if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
        setWalletError("Enter a valid transfer amount greater than zero.");
        setWalletFeedback(null);
        return;
      }

      if (parsedAmount > walletBalance) {
        setWalletError("Insufficient balance for this transfer.");
        setWalletFeedback(null);
        return;
      }

      if (!walletRecipient) {
        setWalletError("Specify a recipient address.");
        setWalletFeedback(null);
        return;
      }

      const hash = `0x${randomHex(64)}`;
      const entry: LedgerEntry = {
        id: `tx-${Date.now()}`,
        hash,
        from: walletAddress,
        to: walletRecipient,
        amount: parsedAmount,
        memo: walletMemo || undefined,
        status: "confirmed",
        timestamp: new Date().toISOString(),
        origin: "wallet"
      };

      setLedger((prev) => [entry, ...prev]);
      setWalletBalance((prev) => prev - parsedAmount);
      setWalletFeedback(
        `Transfer executed. Hash ${shortHash(hash)} recorded and ${TOKEN_TICKER} balance updated.`
      );
      setWalletError(null);
      setWalletAmount("0.0000");
      setWalletMemo("");
      appendCommand(
        "wallet",
        `sent ${formatAmount(parsedAmount)} ${TOKEN_NAME} to ${walletRecipient.slice(0, 10)}…${walletRecipient.slice(-6)}`
      );
    },
    [appendCommand, walletAddress, walletAmount, walletBalance, walletMemo, walletRecipient]
  );

  const handleFaucetRequest = useCallback(() => {
    if (!walletAddress) {
      setWalletError("Generate a wallet before requesting faucet liquidity.");
      setActiveRoute("/wallet");
      return;
    }

    if (isFaucetPending) {
      return;
    }

    setIsFaucetPending(true);
    const amount = randomBetween(24, 96) + Math.random();
    const hash = `0x${randomHex(64)}`;
    const entry: FaucetEntry = {
      id: `drip-${Date.now()}`,
      amount,
      to: walletAddress,
      timestamp: new Date().toISOString(),
      status: "completed"
    };

    const ledgerEntry: LedgerEntry = {
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      hash,
      from: "0xProtocol::Faucet",
      to: walletAddress,
      amount,
      memo: "faucet disbursement",
      status: "confirmed",
      timestamp: entry.timestamp,
      origin: "faucet"
    };

    window.setTimeout(() => {
      setLedger((prev) => [ledgerEntry, ...prev]);
      setFaucetHistory((prev) => [entry, ...prev.slice(0, 4)]);
      setWalletBalance((prev) => prev + amount);
      setWalletFeedback(`Faucet delivered ${formatAmount(amount)} ${TOKEN_NAME} to your wallet.`);
      setWalletError(null);
      setIsFaucetPending(false);
      appendCommand(
        "faucet",
        `disbursed ${formatAmount(amount)} ${TOKEN_NAME} to ${walletAddress.slice(0, 10)}…${walletAddress.slice(-6)}`
      );
    }, 1800);
  }, [appendCommand, isFaucetPending, walletAddress]);

  const handleCopyAddress = useCallback((address: string) => {
    setCopiedAddress(address);
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(address).catch(() => {
        /* Swallow clipboard permission errors while still surfacing UI feedback */
      });
    }
    appendCommand("explorer", `copied address ${address.slice(0, 10)}…${address.slice(-6)}`);
  }, [appendCommand]);

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
                  Active telemetry from the 0xProtocol network. Track validator governance, block finality, and resource flow in
                  real time as the AI collective steers the chain.
                </p>
                <div className="status-grid">
                  <article className="status-card">
                    <span className="metric-label">finalised height</span>
                    <span className="metric-value">{networkStats.latestHeight.toLocaleString()}</span>
                  </article>
                  <article className="status-card">
                    <span className="metric-label">median latency</span>
                    <span className="metric-value">{networkStats.avgLatency.toFixed(2)}s</span>
                  </article>
                  <article className="status-card">
                    <span className="metric-label">avg throughput</span>
                    <span className="metric-value">{Math.round(networkStats.avgTps).toLocaleString()} TPS</span>
                  </article>
                  <article className="status-card">
                    <span className="metric-label">ledger events</span>
                    <span className="metric-value">{networkStats.totalTransactions}</span>
                  </article>
                </div>
                <div className="manifest-grid">
                  {manifestCards.map((section) => (
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
                  Validators operate as AI personas specialised for scheduling, ethics, orchestration, and public reporting. Upti
                  me and status indicators update from heartbeat telemetry.
                </p>
                <div className="validator-grid">
                  {validatorAgents.map((agent) => (
                    <article key={agent.id} className="validator-card">
                      <header>
                        <h3>{agent.id}</h3>
                        <span className={clsx("badge", agent.status)}>{agent.status}</span>
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
                  Continuous finality feed. New blocks stream in as validator personas rotate leadership, carrying aggregated pro
                  ofs and conversational governance outcomes.
                </p>
                <div className="block-feed">
                  {blocks.map((block) => (
                    <div key={`${block.height}-${block.hash}`} className="block-card">
                      <header>
                        <span className="block-height">#{block.height.toLocaleString()}</span>
                        <span className="block-producer">proposer {block.producer}</span>
                      </header>
                      <div className="block-metrics">
                        <span>{formatAmount(block.tps)} TPS</span>
                        <span>{block.latency.toFixed(2)}s latency</span>
                        <span>{block.txCount.toLocaleString()} tx</span>
                      </div>
                      <p>{block.commentary}</p>
                      <footer className="block-footer">
                        <span>{shortHash(block.hash)}</span>
                        <span>{formatTime(block.timestamp)}</span>
                      </footer>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeRoute === "/explorer" && (
              <div className="route-content">
                <h2>/explorer</h2>
                <p className="route-intro">
                  Ledger registry with live events from treasury, validators, and faucet disbursements. Copy addresses or scan tr
                  ansaction hashes to trace the flow of value through the commons.
                </p>
                <table className="explorer-table">
                  <thead>
                    <tr>
                      <th scope="col">Label</th>
                      <th scope="col">Address</th>
                      <th scope="col">Balance</th>
                      <th scope="col">Notes</th>
                      <th scope="col" className="sr-only">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {explorerAddresses.map((entry) => (
                      <tr key={entry.address}>
                        <th scope="row">{entry.label}</th>
                        <td>{entry.address}</td>
                        <td>{entry.balance}</td>
                        <td>{entry.notes}</td>
                        <td>
                          <button
                            type="button"
                            className="copy-button"
                            onClick={() => handleCopyAddress(entry.address)}
                          >
                            copy
                          </button>
                          {copiedAddress === entry.address && <span className="copy-status">copied</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="ledger-section">
                  <h3>Recent transactions</h3>
                  <table className="ledger-table">
                    <thead>
                      <tr>
                        <th scope="col">Hash</th>
                        <th scope="col">From</th>
                        <th scope="col">To</th>
                        <th scope="col">Amount</th>
                        <th scope="col">Memo</th>
                        <th scope="col">Status</th>
                        <th scope="col">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ledger.map((entry) => (
                        <tr key={entry.id}>
                          <td>{shortHash(entry.hash)}</td>
                          <td>{shortHash(entry.from)}</td>
                          <td>{shortHash(entry.to)}</td>
                          <td>{formatAmount(entry.amount)} {TOKEN_TICKER}</td>
                          <td>{entry.memo ?? "—"}</td>
                          <td>
                            <span className={clsx("status-pill", entry.origin)}>{entry.status}</span>
                          </td>
                          <td>{formatTime(entry.timestamp)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeRoute === "/markets" && (
              <div className="route-content markets-route">
                <h2>/markets</h2>
                <p className="route-intro">
                  {TOKEN_NAME} ({TOKEN_TICKER}) liquidity desk. Five-minute candles illustrate validator-side flow with live
                  participant counts and rolling volume.
                </p>

                <div className="markets-board">
                  <div
                    className="markets-chart"
                    role="img"
                    aria-label={`Live ${TOKEN_NAME} ${TOKEN_TICKER} five-minute candlestick chart`}
                  >
                    <svg
                      viewBox={`0 0 ${chartMetrics.width} ${chartMetrics.height}`}
                      preserveAspectRatio="none"
                    >
                      <rect
                        x={0}
                        y={0}
                        width={chartMetrics.width}
                        height={chartMetrics.height}
                        className="chart-surface"
                      />
                      {Array.from({ length: 5 }, (_, index) => {
                        const value = chartMetrics.min + (priceRange / 4) * index;
                        const y = mapY(value);
                        return (
                          <g key={`grid-${index}`}>
                            <line x1={0} x2={chartMetrics.width} y1={y} y2={y} className="chart-grid" />
                            <text x={chartMetrics.width - 6} y={y - 6} className="chart-label">
                              {value.toFixed(2)}
                            </text>
                          </g>
                        );
                      })}
                      {candles.map((candle, index) => {
                        const x = mapX(index);
                        const yHigh = mapY(candle.high);
                        const yLow = mapY(candle.low);
                        const yOpen = mapY(candle.open);
                        const yClose = mapY(candle.close);
                        const bodyTop = Math.min(yOpen, yClose);
                        const bodyHeight = Math.max(Math.abs(yClose - yOpen), 2);
                        const candleClass = candle.close >= candle.open ? "up" : "down";
                        return (
                          <g key={candle.id} className={clsx("candle", candleClass)}>
                            <line
                              x1={x}
                              x2={x}
                              y1={yHigh}
                              y2={yLow}
                              className="candle-wick"
                            />
                            <rect
                              x={x - chartMetrics.candleWidth / 2}
                              y={bodyTop}
                              width={chartMetrics.candleWidth}
                              height={bodyHeight || 2}
                              className="candle-body"
                            />
                          </g>
                        );
                      })}
                    </svg>
                    <div className="markets-price-card">
                      <div>
                        <span>last price</span>
                        <strong>{marketStats.latest.close.toFixed(4)} {TOKEN_TICKER}</strong>
                      </div>
                      <div>
                        <span>5m change</span>
                        <strong className={clsx({ positive: marketStats.priceChange >= 0, negative: marketStats.priceChange < 0 })}>
                          {formatSigned(marketStats.priceChange, 3)} {TOKEN_TICKER}
                        </strong>
                        <em>{formatSigned(marketStats.changePercent, 2)}%</em>
                      </div>
                      <div>
                        <span>session delta</span>
                        <strong className={clsx({ positive: marketStats.sessionChangePercent >= 0, negative: marketStats.sessionChangePercent < 0 })}>
                          {formatSigned(marketStats.sessionChangePercent, 2)}%
                        </strong>
                      </div>
                      <div>
                        <span>rolling volume</span>
                        <strong>{Math.round(marketStats.rollingVolume).toLocaleString()} {TOKEN_TICKER}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="markets-metrics">
                    <article className="metric-card">
                      <header>buyers (5m)</header>
                      <strong>{marketStats.latest.buyers.toLocaleString()}</strong>
                      <span
                        className={clsx("metric-delta", {
                          positive: marketStats.buyersDelta >= 0,
                          negative: marketStats.buyersDelta < 0
                        })}
                      >
                        {formatSigned(marketStats.buyersDelta, 0)} vs prev
                      </span>
                    </article>
                    <article className="metric-card">
                      <header>sellers (5m)</header>
                      <strong>{marketStats.latest.sellers.toLocaleString()}</strong>
                      <span
                        className={clsx("metric-delta", {
                          positive: marketStats.sellersDelta >= 0,
                          negative: marketStats.sellersDelta < 0
                        })}
                      >
                        {formatSigned(marketStats.sellersDelta, 0)} vs prev
                      </span>
                    </article>
                    <article className="metric-card">
                      <header>holders (network)</header>
                      <strong>{marketStats.latest.holders.toLocaleString()}</strong>
                      <span
                        className={clsx("metric-delta", {
                          positive: marketStats.holdersDelta >= 0,
                          negative: marketStats.holdersDelta < 0
                        })}
                      >
                        {formatSigned(marketStats.holdersDelta, 0)} new
                      </span>
                    </article>
                    <article className="metric-card">
                      <header>validator sentiment</header>
                      <strong>
                        {marketStats.priceChange >= 0 ? "bullish" : "neutral"}
                      </strong>
                      <span className="metric-delta">
                        0xProtocol desks broadcasting AI-governed bids.
                      </span>
                    </article>
                  </div>

                  <div className="markets-feed">
                    <h3>Recent five-minute prints</h3>
                    <table>
                      <thead>
                        <tr>
                          <th scope="col">Time</th>
                          <th scope="col">Open</th>
                          <th scope="col">Close</th>
                          <th scope="col">High</th>
                          <th scope="col">Low</th>
                          <th scope="col">Volume</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...candles.slice(-6)].reverse().map((candle) => (
                          <tr key={`feed-${candle.id}`}>
                            <td>{formatTime(candle.timestamp)}</td>
                            <td>{candle.open.toFixed(4)}</td>
                            <td>{candle.close.toFixed(4)}</td>
                            <td>{candle.high.toFixed(4)}</td>
                            <td>{candle.low.toFixed(4)}</td>
                            <td>{Math.round(candle.volume).toLocaleString()} {TOKEN_TICKER}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeRoute === "/wallet" && (
              <div className="route-content">
                <h2>/wallet</h2>
                <p className="route-intro">
                  Manage a research wallet directly from the terminal. Generate fresh addresses, sign transfers, and monitor balance updates without leaving the interface.
                </p>
                <div className="wallet-provider">
                  <div className="provider-header">
                    <span>phantom</span>
                    <span className={clsx("status-pill", phantomAddress ? "active" : phantomAvailable ? "attesting" : "pending")}>
                      {phantomAddress ? "linked" : phantomAvailable ? "detected" : "missing"}
                    </span>
                  </div>
                  <div className="provider-controls">
                    <button
                      type="button"
                      onClick={handlePhantomConnect}
                      disabled={phantomConnecting || Boolean(phantomAddress)}
                    >
                      {phantomConnecting ? "connecting" : phantomAddress ? "connected" : "connect phantom"}
                    </button>
                    {phantomAddress && (
                      <button type="button" onClick={handlePhantomDisconnect} className="secondary">
                        disconnect
                      </button>
                    )}
                  </div>
                  <p>
                    {phantomAddress
                      ? `linked ${phantomAddress.slice(0, 10)}…${phantomAddress.slice(-6)} to the terminal`
                      : phantomAvailable
                      ? "extension detected — authorise connection to sync balances"
                      : "install Phantom wallet to bridge Solana access"}
                  </p>
                </div>
                <div className="wallet-actions">
                  <button type="button" onClick={handleGenerateWallet}>
                    generate wallet
                  </button>
                  <div className="wallet-balance">
                    <span>address</span>
                    <strong>{walletAddress ? `${walletAddress.slice(0, 12)}…${walletAddress.slice(-6)}` : "—"}</strong>
                  </div>
                  <div className="wallet-balance">
                    <span>balance</span>
                    <strong>{formatAmount(walletBalance)} {TOKEN_TICKER}</strong>
                  </div>
                </div>
                <form className="wallet-form" onSubmit={handleWalletSubmit} aria-describedby="wallet-feedback">
                  <label htmlFor="wallet-recipient">recipient</label>
                  <input
                    id="wallet-recipient"
                    name="wallet-recipient"
                    placeholder="0xRecipient..."
                    value={walletRecipient}
                    onChange={(event) => setWalletRecipient(event.target.value)}
                    autoComplete="off"
                  />

                  <label htmlFor="wallet-amount">amount</label>
                  <input
                    id="wallet-amount"
                    name="wallet-amount"
                    placeholder="0.0000"
                    value={walletAmount}
                    onChange={(event) => setWalletAmount(event.target.value)}
                    autoComplete="off"
                  />

                  <label htmlFor="wallet-memo">memo</label>
                  <input
                    id="wallet-memo"
                    name="wallet-memo"
                    placeholder="optional memo"
                    value={walletMemo}
                    onChange={(event) => setWalletMemo(event.target.value)}
                    autoComplete="off"
                  />

                  <fieldset>
                    <legend>terminal shortcuts</legend>
                    <ul>
                      {walletShortcuts.map((shortcut) => (
                        <li key={shortcut}>{shortcut}</li>
                      ))}
                    </ul>
                  </fieldset>

                  <button type="submit">execute transfer</button>
                </form>
                <div id="wallet-feedback" className="route-messages">
                  {walletFeedback && <p className="success">{walletFeedback}</p>}
                  {walletError && <p className="error">{walletError}</p>}
                  {phantomError && <p className="error">{phantomError}</p>}
                </div>

                <div className="ledger-section">
                  <h3>Wallet ledger</h3>
                  <table className="ledger-table">
                    <thead>
                      <tr>
                        <th scope="col">Hash</th>
                        <th scope="col">Direction</th>
                        <th scope="col">Counterparty</th>
                        <th scope="col">Amount</th>
                        <th scope="col">Memo</th>
                        <th scope="col">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ledger
                        .filter((entry) => entry.from === walletAddress || entry.to === walletAddress)
                        .map((entry) => {
                          const direction = entry.from === walletAddress ? "out" : "in";
                          const counterparty = entry.from === walletAddress ? entry.to : entry.from;
                          return (
                            <tr key={`${entry.id}-wallet`}>
                              <td>{shortHash(entry.hash)}</td>
                              <td>
                                <span className={clsx("status-pill", direction)}>{direction}</span>
                              </td>
                              <td>{shortHash(counterparty)}</td>
                              <td>{formatAmount(entry.amount)} {TOKEN_TICKER}</td>
                              <td>{entry.memo ?? "—"}</td>
                              <td>{formatTime(entry.timestamp)}</td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeRoute === "/faucet" && (
              <div className="route-content">
                <h2>/faucet</h2>
                <p className="route-intro">
                  Provision research capital straight to your terminal wallet. Claims settle instantly once validators approve t
                  he request.
                </p>
                <div className="faucet-actions">
                  <button type="button" onClick={handleFaucetRequest} disabled={isFaucetPending}>
                    {isFaucetPending ? "processing" : "request drip"}
                  </button>
                  <p>
                    Faucet disbursements reference the currently selected wallet. Generate or select an address in the wallet ro
                    ute before requesting.
                  </p>
                </div>
                <div className="faucet-grid">
                  {faucetHistory.length === 0 ? (
                    <article className="faucet-card">
                      <header>
                        <span className="faucet-label">no disbursements yet</span>
                        <span className="faucet-status pending">pending</span>
                      </header>
                      <p>Requests will appear here with confirmation hashes and timestamps.</p>
                    </article>
                  ) : (
                    faucetHistory.map((drip) => (
                      <article key={drip.id} className="faucet-card">
                        <header>
                          <span className="faucet-label">{formatTime(drip.timestamp)}</span>
                          <span className={clsx("faucet-status", drip.status)}>{drip.status}</span>
                        </header>
                        <p>
                          Sent {formatAmount(drip.amount)} {TOKEN_NAME} to {drip.to.slice(0, 10)}…{drip.to.slice(-6)}
                        </p>
                      </article>
                    ))
                  )}
                </div>
              </div>
            )}
          </motion.section>
        </AnimatePresence>
      </section>

      <footer className="terminal-footer">
        <p>© {new Date().getFullYear()} 0xProtocol — autonomous Proof-of-AI commons.</p>
      </footer>
    </div>
  );
}
