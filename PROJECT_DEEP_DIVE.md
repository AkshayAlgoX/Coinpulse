# CoinPulse: Project Deep Dive & Architecture Overview

`CoinPulse` is a high-performance cryptocurrency screener and terminal dashboard built with **Next.js 15 (App Router)** and **React 19**. It provides real-time market data, trending insights, and technical analysis tools by integrating with the **CoinGecko API**.

---

## 1. Technical Stack
*   **Framework:** `Next.js` (App Router) — Utilizing Server Components for SEO and speed, and Client Components for real-time interactivity.
*   **Data Fetching:**
    *   **Server-side:** Custom `fetcher` abstraction in `lib/coingecko.server.ts` (server components only) using `fetch` with Next.js revalidation.
    *   **Client-side:** `SWR` for search results and `setInterval` polling for "live" price updates.
*   **Styling & UI:** `Tailwind CSS` for utility-first styling, `Radix UI` for accessible primitives (Dialogs, Modals), and `Lucide React` for iconography.
*   **Charts:** `lightweight-charts` by TradingView for high-performance financial data visualization (OHLC).
*   **Utilities:** `clsx` and `tailwind-merge` for dynamic class management; `query-string` for robust URL construction.

---

## 2. Core Architecture & Data Flow

### A. Centralized Data Fetching (`lib/coingecko.server.ts`)
Instead of calling `fetch` everywhere, server components use a centralized `fetcher` function.
*   **Security:** It injects the `x-cg-demo-api-key` from environment variables server-side, keeping it hidden from the client. It is deliberately not a Server Action: client components call the narrow actions in `lib/coingecko.actions.ts` (`getCoinOHLC`, `getCoinPrice`, `searchCoins`), which validate their input and request one fixed endpoint each.
*   **Error Handling:** Implements standardized error catching for API limits (429) or invalid requests.
*   **Caching:** Uses Next.js `revalidate` tags to cache market data for 60 seconds by default, reducing API calls and improving performance.

### B. Real-Time Simulation Hook (`hooks/useCoinGeckoWebSocket.ts`)
Since the free CoinGecko API doesn't provide real-time WebSockets, this hook simulates a high-frequency trading environment:
*   **Polling:** Every 30 seconds, it fetches the latest price.
*   **Simulation:** Every 4 seconds, it generates "synthetic trades" based on the current price to provide a live-terminal feel.
*   **Robustness:** Uses an `isMounted` flag to prevent memory leaks and state updates after a component unmounts.

### C. Search Engine (`components/SearchModal.tsx`)
A Command-K (`⌘K`) searchable interface:
*   **Debouncing:** Uses `useDebounce` to wait 500ms after the user stops typing before hitting the API.
*   **SWR Integration:** Fetches search results and caches them, providing a "near-instant" feel when typing previously searched terms.

---

## 3. Key Features & Components

### The Dashboard (Home Page)
*   **CoinOverview:** Displays top-tier market statistics (Global Market Cap, Volume, Dominance).
*   **TrendingCoins:** Highlights assets gaining the most traction in the last 24 hours.
*   **Categories:** A `DataTable` driven view showing performance across different sectors (DeFi, AI, Meme Coins, etc.).

### The Terminal (Coin Details Page)
*   **Dynamic Routing:** Uses `app/coins/[coinId]/page.tsx` to handle thousands of unique assets.
*   **Mixed Rendering:**
    *   **Server Side:** Fetches static coin metadata (description, links) and historical OHLC data.
    *   **Client Side:** Hydrates the `LiveDataWrapper` which manages the live price ticker and simulated trade history.

---

## 4. Technical Challenges Solved (Interview Highlights)

1.  **Hydration Mismatch:**
    *   *Problem:* The app crashed because currency formatting (`toLocaleString`) used the user's local browser settings on the client but a different default on the server.
    *   *Solution:* Hardcoded the locale to `'en-US'` in `lib/utils.ts` to ensure the HTML matches exactly between server and client.

2.  **State Race Conditions:**
    *   *Problem:* When a user switched between coins quickly, the previous coin's API request would finish and update the state of the *new* coin.
    *   *Solution:* Implemented a cleanup function in `useEffect` with a local `isMounted` variable to ignore stale API responses.

3.  **API Resilience:**
    *   *Problem:* Direct `fetch` calls didn't handle query encoding or empty search results well.
    *   *Solution:* Built a robust `searchCoins` action that trims queries, validates payloads, and falls back to empty arrays instead of crashing the UI.

---

## 5. Project Structure Overview
*   `/app`: The "Skeleton." Routes, layouts, and page-level data fetching.
*   `/components`: The "Organs." Reusable UI blocks like `DataTable`, `Header`, and `SearchModal`.
*   `/hooks`: The "Nervous System." Logic like `useCoinGeckoWebSocket` that manages state and timing.
*   `/lib`: The "Tools." Utility functions (`cn`, `formatCurrency`), the server-only CoinGecko client (`coingecko.server.ts`) and validated Server Actions (`coingecko.actions.ts`).
*   `/public`: Static assets like the `logo.svg`.
*   `types.d.ts`: TypeScript definitions ensuring data consistency across the app.

---

## 6. Interview Preparation: Key Logic
Be ready to explain or rewrite the `useCoinGeckoWebSocket` logic:
```typescript
// Key pattern: The "isMounted" guard for async operations in useEffect
useEffect(() => {
  let isMounted = true;
  const fetchData = async () => {
    const data = await apiCall();
    if (isMounted) setState(data); // Essential check
  };
  fetchData();
  return () => { isMounted = false; }; // Cleanup
}, [dependency]);
```
