# Cherry Tree

An experimental web application for chunking large files and distributing them across Blossom servers using the Nostr protocol. Cherry Tree breaks files into smaller chunks (typically 1MB or 4MB), uploads them to Blossom servers, and publishes a chunk map as a kind 2001 Nostr event, allowing users to later reconstruct the original file from the distributed chunks.

## Running Locally

### Prerequisites

- Node.js (v18 or higher recommended)
- pnpm (v9.14.4)

### Setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Start the development server:

   ```bash
   pnpm dev
   ```

3. Open your browser to the URL shown in the terminal (typically `http://localhost:5173`)

### Other Commands

- **Build for production**: `pnpm build`
- **Preview production build**: `pnpm preview`
- **Format code**: `pnpm format`

## How It Works

Cherry Tree chunks large files and stores them on Blossom servers, then publishes a chunk map event to nostr relays (see `NIP.md` for the full specification):

1. Large files are broken into chunks of configurable size
2. Each chunk is uploaded to one or more Blossom servers
3. A kind 2001 Nostr event is published containing:
   - Ordered list of chunk SHA-256 hashes
   - Metadata (filename, mime type, size, recommended servers)
4. Users can retrieve and reconstruct files using the published chunk map
