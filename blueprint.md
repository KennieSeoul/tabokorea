# Project Blueprint: KRX Market Map

## Overview
A Finviz-style interactive heatmap for the Korean Stock Exchange (KRX), providing real-time market visualization using WICS (Wise Industry Classification Standard) categories.

## Features
- **WICS 3-Level Hierarchy:** Sector (대분류) → Industry Group (중분류) → Stock (종목).
- **Market Cap Weighted:** Tile sizes represent relative market capitalization.
- **Color-Coded Performance:** 6-level gradient for both gains (Red/Pink) and losses (Blue/Cyan).
- **Interactive UI:**
  - Hover tooltips with detailed stock metadata.
  - Sector-level filtering via navigation buttons.
  - Nested industry group overview on hover.
  - 3-minute auto-refresh with manual refresh capability.
- **Real-time Data:** Integrated with Korea Investment Service (KIS) Open API.

## Tech Stack
- **Frontend:** Next.js (App Router), React, D3.js, Lucide React.
- **Data Engine:** Python (KIS API Client).
- **Styling:** Vanilla CSS-in-JS (React Inline Styles).
- **Deployment:** Cloudflare Pages (Planned).

## Implemented Steps
1. **KIS API Integration:** Created `kis_fetch_300.py` to fetch top 300 stocks and map them to WICS.
2. **Next.js Scaffolding:** Initialized a new Next.js project and integrated React/D3 components.
3. **Data Pipeline:** 
   - Refactored Python script to use `.env` for security.
   - Set up `krx_heatmap_data.json` generation and client-side fetching.
4. **Heatmap Component:**
   - Implemented D3 Squarified Treemap layout.
   - Custom padding logic for nested hierarchies (SH/MH levels).
   - Dynamic color interpolation based on change percentage.

## Current Plan
1. **Cloudflare Deployment:** Configure build settings for Cloudflare Pages.
2. **Automated Data Updates:** Set up a cron job or worker to run `kis_fetch_300.py` periodically.
