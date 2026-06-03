"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { GearLogo, StoryMark } from "@/components/brand/logos";

const ACCENT = "#FF6B1A";
const NOISE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

/** Fade + rise into view on scroll. */
function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${shown ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"} ${className ?? ""}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function CtaPrimary({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      className="inline-flex h-12 items-center justify-center rounded-lg px-6 text-base font-semibold text-[#0A0A0A] transition-transform hover:-translate-y-0.5"
      style={{ backgroundColor: ACCENT }}
    >
      {children}
    </a>
  );
}

function CtaSecondary({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      className="inline-flex h-12 items-center justify-center rounded-lg border border-white/20 px-6 text-base font-medium text-[#FAFAFA] transition-colors hover:bg-white/5"
    >
      {children}
    </a>
  );
}

function IconLock() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
      <rect x="4" y="11" width="16" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}
function IconKey() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
      <circle cx="8" cy="8" r="4" />
      <path d="M11 11l9 9M17 17l2-2M14 14l2-2" />
    </svg>
  );
}
function IconCoin() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v8M9.5 9.5h3.2a1.8 1.8 0 0 1 0 3.6H10.5a1.8 1.8 0 0 0 0 3.6H14" />
    </svg>
  );
}

const PROBLEM_LINES = [
  "If your data is on the internet,",
  "a model is already training on it.",
  "You didn't sell it.",
  "You weren't asked.",
];

const STEPS = [
  {
    icon: <IconLock />,
    title: "Encrypt & list",
    body: "Upload, label the training stage (pretraining, SFT, RLHF, eval), set a price. Your file is encrypted on your device before it leaves your machine.",
  },
  {
    icon: <IconKey />,
    title: "Buyer holds a license",
    body: "Buyers acquire a Story IP license token. The vault unlocks only for license holders, enforced by validators.",
  },
  {
    icon: <IconCoin />,
    title: "Get paid in $IP",
    body: "Settle on-chain. The data, the rights, and the payment are one transaction.",
  },
];

const PILLARS = [
  {
    title: "Encrypted by default",
    body: "Threshold encryption across decentralized TEEs.",
  },
  {
    title: "Owned by you",
    body: "Every dataset registered as a Story IP Asset. Resale, royalties, derivatives — programmable.",
  },
  {
    title: "AI-stage labeled",
    body: "Filter by pretraining, SFT, RLHF, DPO, eval so buyers find what they need.",
  },
  {
    title: "Verifiable provenance",
    body: "Every license is on-chain. No more “where did this data come from?”",
  },
];

const USE_CASES = [
  "Personal writing archives → SFT corpora",
  "Domain-expert annotations → RLHF",
  "Biomedical / financial datasets → vertical models",
  "API logs and traces → agent training",
];

function BuiltOnStory() {
  return (
    <div className="flex items-center gap-3 text-xs font-mono uppercase tracking-widest text-white/40">
      <GearLogo className="h-4 w-4 text-white/50" />
      <span>Built on Story Protocol · Confidential Data Rails</span>
      <StoryMark className="h-4 w-4 text-white/50" />
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="bg-[#0A0A0A] text-[#FAFAFA]">
      {/* 1 — HERO */}
      <section className="relative flex min-h-[100svh] items-center overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{ backgroundImage: NOISE }}
          aria-hidden
        />
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 px-4 py-24 md:grid-cols-2">
          <div className="flex flex-col gap-7">
            <h1 className="text-balance text-5xl font-semibold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
              Fuel the next model.{" "}
              <span style={{ color: ACCENT }}>On your terms.</span>
            </h1>
            <p className="max-w-xl text-lg text-white/60">
              Modelfuel is the encrypted marketplace where data creators sell
              AI-grade datasets without ever exposing them. Built on Story
              Protocol&apos;s Confidential Data Rails.
            </p>
            <div className="flex flex-wrap gap-3">
              <CtaPrimary href="/sell">List your dataset</CtaPrimary>
              <CtaSecondary href="/market">Browse the market</CtaSecondary>
            </div>
            <BuiltOnStory />
          </div>

          <div className="relative flex items-center justify-center">
            <div
              className="absolute left-1/2 top-1/2 h-[70%] w-[70%] rounded-full blur-[90px]"
              style={{ backgroundColor: ACCENT, animation: "mf-glow 6s ease-in-out infinite" }}
              aria-hidden
            />
            <GearLogo className="relative h-64 w-64 text-[#FAFAFA] sm:h-80 sm:w-80 lg:h-[26rem] lg:w-[26rem]" />
          </div>
        </div>
      </section>

      {/* 2 — THE PROBLEM */}
      <section className="border-t border-white/10 px-4 py-32">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <p className="mb-10 font-mono text-xs uppercase tracking-[0.3em] text-white/40">
              The problem
            </p>
          </Reveal>
          <div className="space-y-2 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            {PROBLEM_LINES.map((line, i) => (
              <Reveal key={i} delay={i * 120}>
                <p className={i >= 2 ? "text-white/50" : undefined}>{line}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 3 — HOW IT WORKS */}
      <section className="border-t border-white/10 px-4 py-28">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <h2 className="mb-14 text-3xl font-semibold tracking-tight sm:text-4xl">
              How it works
            </h2>
          </Reveal>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <Reveal key={s.title} delay={i * 120}>
                <div className="group h-full rounded-2xl border border-white/10 bg-white/[0.02] p-7 transition-transform duration-300 hover:-translate-y-1 hover:border-white/20">
                  <div
                    className="mb-5 flex h-12 w-12 items-center justify-center rounded-full"
                    style={{ backgroundColor: "rgba(255,107,26,0.12)", color: ACCENT }}
                  >
                    {s.icon}
                  </div>
                  <div className="mb-2 flex items-baseline gap-2">
                    <span className="font-mono text-sm text-white/30">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3 className="text-xl font-semibold">{s.title}</h3>
                  </div>
                  <p className="text-white/55">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 4 — WHY MODELFUEL */}
      <section className="border-t border-white/10 px-4 py-28">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <h2 className="mb-14 text-3xl font-semibold tracking-tight sm:text-4xl">
              Why Modelfuel
            </h2>
          </Reveal>
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 md:grid-cols-2">
            {PILLARS.map((p, i) => (
              <Reveal key={p.title} delay={(i % 2) * 100} className="h-full">
                <div className="h-full bg-[#0A0A0A] p-8">
                  <h3 className="mb-2 text-xl font-semibold">
                    <span style={{ color: ACCENT }}>—</span> {p.title}
                  </h3>
                  <p className="text-white/55">{p.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 5 — USE CASES (marquee) */}
      <section className="overflow-hidden border-t border-white/10 py-20">
        <Reveal className="mb-10 px-4">
          <p className="mx-auto max-w-6xl font-mono text-xs uppercase tracking-[0.3em] text-white/40">
            What people sell
          </p>
        </Reveal>
        <div className="flex w-max" style={{ animation: "mf-marquee 32s linear infinite" }}>
          {[...USE_CASES, ...USE_CASES].map((u, i) => (
            <span
              key={i}
              className="mx-3 inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-white/15 px-5 py-2.5 text-sm text-white/70"
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: ACCENT }} />
              {u}
            </span>
          ))}
        </div>
      </section>

      {/* 6 — FOR CREATORS / FOR BUILDERS */}
      <section className="border-t border-white/10 px-4 py-28">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 md:grid-cols-2">
          <Reveal className="h-full">
            <div className="flex h-full flex-col bg-[#0A0A0A] p-9">
              <h3 className="mb-5 text-2xl font-semibold">If you have data</h3>
              <ul className="mb-8 space-y-3 text-white/60">
                <li>Sell it without ever uploading it in the clear.</li>
                <li>Keep ownership — set royalties and resale rights on-chain.</li>
                <li>Price it once; get paid every time it&apos;s licensed.</li>
              </ul>
              <div className="mt-auto">
                <CtaPrimary href="/sell">Start selling</CtaPrimary>
              </div>
            </div>
          </Reveal>
          <Reveal className="h-full" delay={100}>
            <div className="flex h-full flex-col bg-[#0A0A0A] p-9">
              <h3 className="mb-5 text-2xl font-semibold">If you build models</h3>
              <ul className="mb-8 space-y-3 text-white/60">
                <li>Source licensed, stage-labeled data you can actually use.</li>
                <li>Provenance is on-chain — defensible training data.</li>
                <li>Unlock the vault the moment you hold the license.</li>
              </ul>
              <div className="mt-auto">
                <CtaSecondary href="/market">Browse the market</CtaSecondary>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 7 — CLOSING + FOOTER */}
      <section className="border-t border-white/10 px-4 py-28 text-center">
        <Reveal>
          <h2 className="mx-auto max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            Your data is worth something.{" "}
            <span style={{ color: ACCENT }}>Sell it like it is.</span>
          </h2>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <CtaPrimary href="/sell">List your dataset</CtaPrimary>
            <CtaSecondary href="/market">Browse the market</CtaSecondary>
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-white/10 px-4 py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <GearLogo className="h-7 w-7 text-[#FAFAFA]" />
            <span className="text-lg font-semibold">Modelfuel</span>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/50">
            <a href="/market" className="hover:text-white">Market</a>
            <a href="/sell" className="hover:text-white">List a dataset</a>
            <a href="/my-listings" className="hover:text-white">My listings</a>
            <a href="/my/library" className="hover:text-white">Library</a>
          </nav>
          <div className="flex items-center gap-2 text-xs text-white/40">
            <span>Built on Story Protocol</span>
            <StoryMark className="h-4 w-4 text-white/50" />
          </div>
        </div>
        <p className="mx-auto mt-8 max-w-6xl text-xs text-white/30">
          © {new Date().getFullYear()} Modelfuel. The marketplace for AI-grade data. Encrypted by default. Owned by you.
        </p>
      </footer>
    </div>
  );
}
