/**
 * Pre-download and index OpenAddresses collections so the MCP server can
 * answer queries immediately on startup without waiting for on-demand indexing.
 *
 * Usage:
 *   npx tsx src/download-data.ts                   # all collections
 *   npx tsx src/download-data.ts us-south us-west  # specific collections by name
 *
 * Authentication:
 *   Downloads require a free account at https://batch.openaddresses.io (GitHub login).
 *   1. Log in at https://batch.openaddresses.io
 *   2. Open DevTools → Application → Local Storage → batch.openaddresses.io
 *      OR go to your profile and create an API token via the Token menu.
 *   3. Set the token in your environment:
 *        $env:OA_TOKEN = "your-jwt-token"   # PowerShell
 *        export OA_TOKEN=your-jwt-token      # bash
 *   4. Re-run: npm run download-data
 *
 * For large collections (multi-GB), the script downloads the ZIP with curl
 * into the data/ folder before indexing.  If the ZIP is already present it
 * is reused, so interrupted downloads can be retried without starting over.
 * Pass --keep-zip to preserve the ZIP after indexing (useful for debugging).
 */

import "dotenv/config";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Worker } from "node:worker_threads";
import { fetchCollections, type Collection } from "./collections.js";
import { isDbIndexed } from "./db.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "data");

function formatBytes(bytes: number): string {
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(1)} GB`;
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

/**
 * Download a URL to a local file using curl.exe.
 * curl handles redirects (including S3 pre-signed URLs), retries, and huge files
 * far more reliably than a Node.js HTTP stream.
 *
 * Pass resumeFrom > 0 to resume an interrupted download (--continue-at).
 */
function downloadWithCurl(url: string, destPath: string, token?: string, resumeFrom = 0): void {
  const curlArgs = [
    "--location",          // follow redirects
    "--fail",              // exit non-zero on HTTP errors
    "--silent",
    "--show-error",
    "--output", destPath,
    "--retry", "5",
    "--retry-delay", "30",
    "--retry-max-time", "7200",
  ];
  if (resumeFrom > 0) {
    curlArgs.push("--continue-at", String(resumeFrom));
  }
  if (token) {
    curlArgs.push("--header", `Authorization: Bearer ${token}`);
  }
  curlArgs.push(url);

  // curl.exe is bundled with Windows 10+ and available on macOS/Linux as curl
  const curlBin = process.platform === "win32" ? "curl.exe" : "curl";
  execFileSync(curlBin, curlArgs, { stdio: ["ignore", "inherit", "inherit"] });
}

function indexCollection(collection: Collection, localPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const collectionId = String(collection.id);

    const worker = new Worker(join(__dirname, "indexer-worker.ts"), {
      execArgv: ["--import", "tsx"],
      workerData: { collectionId, downloadUrl: localPath },
    });

    worker.once("message", (msg: { type: string; message?: string }) => {
      if (msg.type === "done") {
        resolve();
      } else {
        reject(new Error(msg.message ?? "Unknown indexer error"));
      }
    });

    worker.once("error", reject);
    worker.once("exit", (code: number) => {
      if (code !== 0) reject(new Error(`Worker process exited with code ${code}`));
    });
  });
}

async function main() {
  const args = process.argv.slice(2);

  const keepZip = args.includes("--keep-zip");
  if (keepZip) args.splice(args.indexOf("--keep-zip"), 1);

  // --file <path>: index a locally downloaded ZIP instead of fetching from the network.
  // Usage: pnpm download-data <collection-name> --file <absolute-path-to-zip>
  const fileArgIdx = args.indexOf("--file");
  const localFilePath = fileArgIdx !== -1 ? args.splice(fileArgIdx, 2)[1] : undefined;

  const token = process.env.OA_TOKEN;
  if (!token && !localFilePath) {
    console.error(
      "\nError: OA_TOKEN environment variable is not set.\n" +
      "batch.openaddresses.io requires authentication to download collections.\n\n" +
      "To get a token:\n" +
      "  1. Log in at https://batch.openaddresses.io (GitHub account required)\n" +
      "  2. Open your profile → Tokens → Create a new token\n" +
      "  3. Set it in PowerShell:  $env:OA_TOKEN = \"<your-token>\"\n" +
      "     Or in bash:            export OA_TOKEN=<your-token>\n" +
      "  4. Re-run: npm run download-data\n\n" +
      "Alternatively, download the ZIP manually and pass it with --file:\n" +
      "  pnpm download-data us-west --file C:\\Downloads\\us-west.zip\n"
    );
    process.exit(1);
  }

  const filterNames = args.map((s) => s.toLowerCase());

  const collections = await fetchCollections(token);

  const targets: Collection[] =
    filterNames.length > 0
      ? collections.filter((c) => filterNames.includes(c.name.toLowerCase()))
      : collections;

  if (targets.length === 0) {
    console.error("No matching collections found. Available:", collections.map((c) => c.name).join(", "));
    process.exit(1);
  }

  if (localFilePath && targets.length > 1) {
    console.error("Error: --file can only be used with a single collection name.");
    process.exit(1);
  }

  mkdirSync(DATA_DIR, { recursive: true });

  console.log(`\nCollections to index: ${targets.map((c) => c.name).join(", ")}\n`);

  for (const collection of targets) {
    const collectionId = String(collection.id);
    const sizeStr = collection.size ? ` (~${formatBytes(collection.size)})` : "";

    if (isDbIndexed(collectionId)) {
      console.log(`[${collection.name}] Already indexed — skipping.`);
      continue;
    }

    // Resolve the path to the local ZIP we'll index from
    let zipPath: string;
    let downloadedByUs = false;

    if (localFilePath) {
      zipPath = localFilePath;
    } else {
      zipPath = join(DATA_DIR, `${collection.name}.zip`);
      const remoteUrl = collection.download_url
        ?? `https://batch.openaddresses.io/api/collections/${collectionId}/data`;

      if (existsSync(zipPath)) {
        const existingSize = statSync(zipPath).size;
        const expectedSize = collection.size ?? 0;
        if (expectedSize > 0 && existingSize < expectedSize) {
          console.log(`[${collection.name}] Resuming partial download (${formatBytes(existingSize)} / ${formatBytes(expectedSize)}) → ${zipPath} ...`);
          const dlStart = Date.now();
          downloadWithCurl(remoteUrl, zipPath, token, existingSize);
          const dlSec = ((Date.now() - dlStart) / 1000).toFixed(1);
          console.log(`[${collection.name}] Download complete in ${dlSec}s.`);
          downloadedByUs = true;
        } else {
          console.log(`[${collection.name}] ZIP already in data/ — skipping download.`);
        }
      } else {
        console.log(`[${collection.name}] Downloading${sizeStr} → ${zipPath} ...`);
        const dlStart = Date.now();
        downloadWithCurl(remoteUrl, zipPath, token);
        const dlSec = ((Date.now() - dlStart) / 1000).toFixed(1);
        console.log(`[${collection.name}] Download complete in ${dlSec}s.`);
        downloadedByUs = true;
      }
    }

    console.log(`[${collection.name}] Indexing...`);
    const indexStart = Date.now();

    try {
      await indexCollection(collection, zipPath);
      const elapsed = ((Date.now() - indexStart) / 1000 / 60).toFixed(1);
      console.log(`[${collection.name}] Indexed in ${elapsed} min.`);

      if (downloadedByUs && !keepZip) {
        rmSync(zipPath);
        console.log(`[${collection.name}] ZIP removed (pass --keep-zip to retain).`);
      }
    } catch (err) {
      console.error(`[${collection.name}] Failed:`, err);
      process.exitCode = 1;
    }
  }

  console.log("\nAll done.");
}

main();
