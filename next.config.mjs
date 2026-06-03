/** @type {import('next').NextConfig} */

// Privy declares these as *optional* peer deps (Solana / Farcaster / Abstract /
// smart-account connectors). ModelFuel is ethereum-only on Story, so they're
// never used — but webpack still tries to resolve the imports and hard-fails.
// Alias them to empty modules instead of installing the whole Solana stack.
const unusedPrivyOptionalDeps = [
  "@abstract-foundation/agw-client",
  "@farcaster/mini-app-solana",
  "@solana/kit",
  "@solana-program/system",
  "@solana-program/token",
  "@solana-program/memo",
  "permissionless",
];

const nextConfig = {
  // Allows building into a throwaway dir (NEXT_DIST_DIR) so a verification build
  // doesn't clobber a running `next dev` server's .next. Defaults to .next.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Escape hatch: the SWC minifier can OOM compiling the heavy crypto/SDK deps
  // on low-RAM machines. Set NEXT_NO_MINIFY=1 to build without minification.
  swcMinify: process.env.NEXT_NO_MINIFY !== "1",
  // Node-native packages (WASM / node: built-ins) used only in Node route
  // handlers — keep them out of webpack and require them natively at runtime.
  experimental: {
    serverComponentsExternalPackages: [
      "@piplabs/cdr-sdk",
      "@piplabs/cdr-crypto",
      "@piplabs/cdr-contracts",
      "helia",
      "@helia/unixfs",
      "libp2p",
      "@libp2p/http",
      "@libp2p/http-utils",
    ],
  },
  webpack: (config, { isServer, webpack }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      ...Object.fromEntries(unusedPrivyOptionalDeps.map((dep) => [dep, false])),
    };
    // Optional logging/storage deps pulled in transitively by WalletConnect
    // (enabled via the "wallet" login method). Not needed in the browser.
    config.externals.push("pino-pretty", "lokijs", "encoding");

    // The CDR SDK ships WASM crypto; allow loading it as an async module.
    config.experiments = { ...config.experiments, asyncWebAssembly: true };
    // Node core modules referenced by CDR/Helia deps that have no browser use.
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    // Client bundle only: the CDR WASM glue statically imports node: builtins
    // that are gated to its Node code path (the browser path uses fetch +
    // WebAssembly). Webpack rejects the `node:` scheme before alias resolution,
    // so strip the prefix, then map the bare builtins to empty modules — the
    // browser branch never touches them. Server keeps the real ones via
    // serverComponentsExternalPackages.
    if (!isServer) {
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
          resource.request = resource.request.replace(/^node:/, "");
        }),
      );
      config.resolve.fallback = {
        ...config.resolve.fallback,
        module: false,
        path: false,
        url: false,
        crypto: false,
        stream: false,
        buffer: false,
      };
    }
    return config;
  },
};

export default nextConfig;
