# Vedora Hotel

A pay-first restaurant ordering demo built by **Vedora Labs**: a guest app, a billing counter and a kitchen display, all front-end, all live.

```bash
bun install        # or npm install
bun run start      # http://localhost:4200
bun run build      # production build → dist/vedora-hotel
```

## The flow

```
Guest phone ──pay──▶ Billing machine ──invoice + KOT──▶ Kitchen display ──ready──▶ Served / collected
```

| Status      | Who moves it        | What happens                                           |
| ----------- | ------------------- | ------------------------------------------------------ |
| `paid`      | Guest               | UPI / card authorised, order created with a token      |
| `billed`    | Billing (auto, ~2s) | Sequential GST invoice `VH/26-27/1001` issued          |
| `queued`    | Billing (auto, ~2s) | KOT printed, grouped by kitchen station                |
| `preparing` | Kitchen             | Chef taps **Start cooking**                            |
| `ready`     | Kitchen             | Chef taps **Mark ready**, guest gets a chime           |
| `completed` | Counter / Kitchen   | **Served** (dine-in) or **Collected** (takeaway)       |
| `refunded`  | Counter             | Allowed until the kitchen starts cooking               |

The kitchen has an **Autopilot** switch (on by default), so a solo visitor sees the whole journey. Turn it off to drive tickets by hand.

## Routes

| Route        | Screen                                                        |
| ------------ | ------------------------------------------------------------- |
| `/`          | Intro animation, hero, dine-in / takeaway picker              |
| `/menu`      | Menu with search, veg filter, customisation sheet             |
| `/checkout`  | Details + UPI (ID or QR) / card payment                       |
| `/order/:id` | Live tracking, journey pipeline, printable e-bill             |
| `/orders`    | Orders placed on this device                                  |
| `/counter`   | Billing POS: KPIs, invoices, KOTs, refunds, printer feed      |
| `/kitchen`   | KDS: New → Cooking → Ready, timers, late alerts, stations     |
| `/showcase`  | All three screens side by side, live (the pitch page)         |

Table QR codes should link to `/?table=7`, which pre-selects dine-in at table 7.

## Demo payment rules

- Card `4242 4242 4242 4242` succeeds; `4000 0000 0000 0002` is declined.
- Any UPI ID succeeds; one containing `fail` is declined.

## How the "backend" works

`src/app/core/order-store.ts` stands in for a server. Orders live in `localStorage`, tabs stay in sync over
`BroadcastChannel`, and writes are serialised with the Web Locks API. The billing machine and autopilot crew
run as a 1-second tick in whichever tabs are open. For production, swap this service for HTTP/WebSocket calls
and `payment-gateway.ts` for Razorpay / PayU; the components don't change.

## Structure

```
src/app/
  core/    models, cart, pricing (GST), order store, payment gateway, session
  data/    menu (Karnataka kitchen, 27 dishes, options, stations)
  ui/      dish illustrations (SVG), hotel facade + intro, receipt, KOT, pipeline…
  pages/   home, menu, checkout, order, orders, counter, kitchen, showcase
```

Set `STUDIO.url` in `src/app/core/restaurant.ts` to link the footer credit to the Vedora Labs site.
