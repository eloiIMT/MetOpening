# Met Opening

A case-opening game where the loot is real artworks from the Metropolitan Museum of Art.

Live site: https://eloiimt.github.io/MetOpening/

> The interface is in French by default. The **FR / EN** switch is on the right of the navigation bar.

## Quick start

Requirements: Node.js 22 or 24 and npm.

```bash
npm ci
npm start
```

Then open http://localhost:4200.

| Command | Purpose |
|---|---|
| `npm test` | Unit tests |
| `npm run data:test` | Data script tests |
| `npm run build:pages` | Build for GitHub Pages |

No backend and no account: everything is saved in the browser.

## Approach

The brief asked for a list, a detail view and a chart built on the Met API. I wanted to give people a reason to browse these artworks: collecting them.

I started from **Wikimasters**, a booster-pack card game. I kept its 5-card packs, rarity tiers and free stock that refills over time.

I removed the **auctions**. In Wikimasters, buying a card at auction is more efficient than opening a booster, so you stop opening packs to discover things. Here, **the only way to get an artwork is to open a case**. Coins earned by selling duplicates can only buy more cases.

## How it works

- A case holds **5 artworks**, each drawn with these odds:

| Tier | Odds | Sell value |
|---|---|---|
| Common | 50% | 5 coins |
| Uncommon | 30% | 10 coins |
| Rare | 16% | 50 coins |
| Epic | 3.4% | 200 coins |
| Legendary | 0.6% | 1,000 coins |

- **Free stock:** 10 cases max, +1 every 3 minutes, even while the site is closed. Open 1, 5 or 10 at a time.
- **Shop:** a Classic case (150 coins) and 11 cases tied to a Met department (250 or 400 coins). Same odds for all: you pay for the theme, not better odds.
- **Economy:** you start with 320 coins. Selling a whole case returns about 130 coins on average, less than the cheapest case: no infinite money.

## How rarity is computed

Rarity comes from the real catalogue, computed once by a Python script from the Met's Open Access file (236,601 titled public-domain works).

1. **Fame:** I count how many Wikipedias have a page for the artist and the artwork (through Wikidata).
2. **Adjustments:** a work "after" or "workshop of" an artist counts less, as do prints and photos made in several copies. Each extra work by the same artist loses a little value, otherwise all 807 of Dürer's engravings would be Legendary.
3. **Score:** fame 55%, Met highlight 30%, Met timeline work 10%, on display in a gallery 5%.
4. **Tiers:** works are ranked by score, then split into 70% Common, 20% Uncommon, 7% Rare, 2.5% Epic, 0.5% Legendary. The 40 most famous artists never drop below Rare.

The 72 MB CSV is then reduced to a small index (`public/data/card-index.json`) that the site loads once.

## Features

- Case opening with a crowbar animation and a dedicated Legendary screen
- Collection and search with filters (tier, department, period), sorting and pagination
- Detail view with a link to the Met website, keyboard navigable
- Charts by tier, department or century, clickable to filter
- Selling, shop, favourites, French / English interface

## Architecture

Angular 22, no chart library (hand-made SVG).

```text
src/app/
  core/      game rules, Met API, collection, economy, translations
  pages/     one folder per screen
  shared/    reusable components (card, detail view, charts, case)
  layout/    navigation and footer
scripts/     index generation and deployment
```

## Challenges

- The Met API's `/v1/search` is retired; `/v1.1/search` only returns ids.
- Past about 80 quick requests, the API blocks access for a minute. I added a request limiter and a cache.
- The 72 MB file had to be reduced to a light index.

## AI usage

I used **Claude Code** (Anthropic) to write code.

Before coding, I used the **grill-me** skill: the AI asks me a series of questions about my project to make me clarify my needs, settle my ideas and spot what I had not planned for. This is how I fixed the game rules before writing a single line.

I designed the game, its rules and the interface, and I drew every mockup myself in **Figma**. Claude Code wrote the code that implements these mockups: I gave it the screen and the rules, then reviewed, tested and had it fix things. The case illustration and animation was also made with the help of Claude.

## Credits

- Artworks: The Metropolitan Museum of Art, public domain
- Photos: Allen McGregor (CC BY 2.0), CHUTTERSNAP, Sui Xu, Michael Pointner (Unsplash)
- Icons: Delapouite and Lorc, game-icons.net (CC BY 3.0)

Fan project, not affiliated with The Metropolitan Museum of Art.
