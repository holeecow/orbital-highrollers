# High Rollers ♠️ Educational Blackjack

**Apollo 11** – Orbital 25  
Learn basic-strategy blackjack the fun, analytical way.

---

## Table of Contents

1. [Why High Rollers?](#why-highrollers)
2. [Features](#features)
3. [Screenshots](#screenshots)
4. [Tech Stack](#tech-stack)
5. [Contributors](#contributors)

---

## Why High Rollers? <a name="why-highrollers"></a>

Most casual blackjack players rely on gut feel, not maths.  
High Rollers lets you practise risk-free, shows the mathematically optimal move for every hand, and explains _why_ that move is best using basic strategy. It is equal parts game, tutor, and stats dashboard.

---

## Features <a name="features"></a>

| Category               | Highlights                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------------- |
| **Core Gameplay**      | • Single-player vs dealer<br>• Hit / Stand / Double / Split<br>• Practice and Credit Rounds |
| **Post-Hand Feedback** | • Every 5–10 hands, see a summary of decisions, EV deltas, and key mistakes                 |
| **Progress Tracking**  | • Session & lifetime “correct move %”<br>• Breakdown by hand type                           |
| **Gamification**       | • Badges for streaks & milestones                                                           |
| **Planned Extensions** | • Leader-boards / friendly multiplayer                                                      |

---

## Screenshots <a name="screenshots"></a>

> _(Add images once the UI is in place – suggested shots: Landing Hero, Hand in Play with Hint, Post-Game Summary, Stats Dashboard.)_

---

## Tech Stack <a name="tech-stack"></a>

| Layer        | Choice                               | Notes                                  |
| ------------ | ------------------------------------ | -------------------------------------- |
| Front-end    | **Next.js** (React 18, Tailwind CSS) | Web first                              |
| Auth + DB    | **Firebase** (Auth & Firestore)      | Simple, server-less, real-time updates |
| Back-end API | **Node.js** (Next API routes)        | Optional custom endpoints              |
| CI / CD      | GitHub Actions → Vercel              | Auto-deploy on push to `main`          |

---

## Contributors <a name="contributors"></a>

Teo Ze Xuan
Gan Zi Heng
