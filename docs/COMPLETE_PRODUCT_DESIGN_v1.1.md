# POPO LIVE — COMPLETE PRODUCT DESIGN (v1.1)
> **Document Status:** CONFIDENTIAL · CLIENT PACK  
> **Specification Version:** 1.1 (18 November 2026)  
> **Source Document:** `docs/Popo-Live-COMPLETE-PRODUCT-DESIGN-v1.1.pdf`  
> **Replaces:** Design Completion v1.0 (Design is the whole job of this file)  
> **Rule Change:** Version 1.1 replaces the empty-screen rule. Every module gets a finished screen. Database and live API come after this plan.

---

## ⚡ SEEDHA MATLAB (Core Executive Directives)

> **Har module ki screen final honi chahiye.**  
> **Kuch missing nahi. Backend baad mein.**  
> **Design fixtures se screen bharni hai, database se nahi.**  
> **Unke host names, photos, aur art copy nahi karne.**

```
┌─────────────────────────────────┐   ┌─────────────────────────────────┐   ┌─────────────────────────────────┐
│        01. EVERY SCREEN         │   │        02. FILLED DESIGN        │   │        03. NO DATABASE          │
│ Me, live, party, chat, gifts,   │   │ Each screen opens on fixture    │   │ Do not add tables or switch     │
│ PK, store, VIP, agency, help,   │   │ data so the product looks       │   │ screens to the API in this      │
│ redeem.                         │   │ finished.                       │   │ sequence.                       │
└─────────────────────────────────┘   └─────────────────────────────────┘   └─────────────────────────────────┘
```

---

## 1. What This Version Finishes

Version 1.0 left Guardian, Redeem Code, visitors, and several interiors empty until a database existed. **That rule is cancelled.** This version finishes the design of every module. A person can open every door and see a complete screen.

### DESIGN FIRST
Build one fixture file on the phone and one on the web. Every screen reads that file. The fixture holds names, counts, gifts, seats, chats, medals, and codes that we write ourselves. Do not add a database table, do not switch a screen to a live API, and do not delete the fixture in this sequence. The later backend plan will replace the fixture one module at a time.

### Fixture Rules
- **One phone file:** `apps/mobile/lib/design/design_fixtures.dart`.  
  **One web file:** `apps/web/lib/design/designFixtures.ts`.  
  *Same people, same counts, same room titles in both.*
- **Use original names:** `Amina Noor`, `Karachi Nights`, `Sana Ali`. Do not use a name or a photo from the reference pictures.
- **Three design states:** Every module has a filled screen. Also design the empty state and the error state, and keep them one tap away in a small design switch at the top of the fixture file. The review in section 6 uses the filled state.
- **Visual Identity:** Our pink, gold, and the light web page stay. Do not paste external/reference logos or campaign art. Policy banners use our sentences and link to our policy pages.
- **Excluded Features:** Near, paid video call, lucky gifts, a direct APK, and 4-host PK stay without an entry. They are not in the reference Me or the reference live page.

---

## 2. The Full Module List

A module is missing until its screen exists, opens from the place named here, and shows fixture content.  
- **Restyle:** The file already exists.  
- **New:** Create it.

| Module | The Screen Shows | Work |
| :--- | :--- | :--- |
| **Live bar** | Live, Party, Square, Message, Me | Restyle bottom bar *(Completed in D1)* |
| **Explore** | Following, Explore, For You, countries, Honor, Activity | Restyle explore home |
| **Room card** | Category, PK badge, viewers, name | Restyle room card |
| **Search** | People, rooms, and IDs | Restyle search |
| **Viewer** | Host row, chat, gift sheet, viewers, follow, close | Restyle viewer |
| **Go Live** | Gate, face, cover, pre-live, studio, end | Restyle the six live screens |
| **PK** | Type, invite, score, result, reactions | Restyle the PK screens |
| **Party list** | Following, Party, rows, seat faces, PARTY button | Restyle discovery |
| **Party room** | 9 seats, request, mic, chat, close | Restyle party room |
| **Message** | People row, official rows, chats | Restyle inbox |
| **Chat thread** | Bubbles, composer, send | Inside inbox, finish the thread |
| **Notices** | System, achievements, security, followers | Restyle notices and notifications |
| **Square** | Feed, create, comments | Restyle the three Square screens |
| **Me** | Name, levels, ID, four counts, coins, points, VIP | Rebuild Me |
| **People lists** | Friends, Following, Followers, Visitors | New, four screens |
| **Coins** | Balance, packages, history | Restyle wallet and coin history |
| **Points** | Balance and history | Restyle points history |
| **VIP** | Plans, active state, history | Restyle VIP |
| **Reward** | Task cards and a claimable badge | Restyle daily tasks |
| **Rank** | Host ranks and the event board | Restyle both ranking screens |
| **Store** | Catalog and item detail | Restyle store |
| **Bag** | Owned items, equip | Store inventory, restyle |
| **Invite** | Code, share, invited people | Restyle invites |
| **Guardian** | List, become guardian, benefits | New |
| **Honor** | Wealth, shining, honor bars | Restyle recognition |
| **Fan Club** | Club, join, members, badge | Restyle fan club |
| **Medal Wall** | Earned medals in a grid | New |
| **Streamer Center** | Tasks, level, starter pack, identity, earnings, go live | New hub over screens that exist |
| **Builder Center** | Agency, agents, coin seller, withdrawal | New hub over screens that exist |
| **Help** | Topics, contact, my tickets | New, three states |
| **Watch history** | Rooms already watched | Restyle live history |
| **Level** | The same honor ladder | Opens recognition |
| **Poster** | One shareable achievement card | New |
| **Redeem** | Code field, success, invalid | New, both results designed |
| **Settings** | Language, safety list, logout, close account | Restyle settings |
| **Profiles** | Edit mine, view someone else | Restyle both |
| **Auth** | Splash, 18+, login, register, OTP, profile | Design pass, same pink system *(Completed in D1)* |
| **Web live** | Light shell and the five rail items | Rebuild DiscoveryShell |
| **Web panels** | Party, Following, Message, Profile, viewer | Inside that shell |

> [!IMPORTANT]
> **Out of Plan Scope:** If a row is not on this list, it is out of this plan. Admin stays a separate web desk and is not part of the public design.

---

## 3. Fixtures, Bar, Live, Party, Message, Square

### D0. Write the fixture once
Create the two fixture files before any screen. Include a viewer, eight live rooms, six party rooms with seat faces, twelve chats, four official rows, a wallet with coins and points, VIP active, eight medals, a fan club, three guardians, a redeem code that succeeds and one that fails, tasks, ranks, store items, bag items, an agency, and a help topic. Add a switch: `filled`, `empty`, `error`. Default is `filled`.

> **DONE WHEN (D0):** Both files exist, the names are ours, and no screen has been restyled yet. *(STATUS: COMPLETED & AUDITED)*

---

### D1. Phone bar and the auth screens
- **Bottom bar:** video, sparkle, round Square, chat, bag. No raised Go Live button.
- **Splash, age gate, login, register, phone OTP, and complete profile** use the same pink and the fixture user after login. Login still accepts the fixture user without a database.

> **DONE WHEN (D1):** A fixture login lands on Explore, and the five icons open the right tabs. *(STATUS: COMPLETED & AUDITED)*

---

### D2. Explore, the room, Go Live, and PK
- **Explore tabs:** Following, Explore, For You. Country chips. Honor tile and Activity Center tile. Room grid from the fixture. A PK ranking banner from the fixture event. Pink LIVE button.
- **A card opens the viewer:** host, follow, viewer count, chat from the fixture, a gift sheet with the fixture gifts, and a close control. Sending a gift updates the fixture balance on screen.
- **LIVE opens the gate:** then face, cover, pre-live, and studio, all filled from the fixture. End screen shows the fixture summary.
- **From the viewer, PK opens:** type, invite, score, and result. 1v1 only. The 4-host choice stays unlabeled and unreachable.

> **DONE WHEN (D2):** You can move from Explore into a room, open gifts, open PK, and walk the go-live screens without a blank page.

---

### D3. Party, Message, and Square
- **Party:** Following and Party, country chips, rows with covers, a status line, seat faces, seat count, viewers. Orange PARTY opens create. A row opens the 9-seat room with request, mic, and chat.
- **Message:** title, search, plus, people row, then Achievements, System, Account Security, New Followers, then chats. A chat opens a thread. An official row opens its notice screen, filled from the fixture.
- **Square (the center tab):** feed, create, and comments, filled from the fixture.

> **DONE WHEN (D3):** Party, a seat room, a chat thread, an official notice, and a Square post are all filled screens.

---

## 4. Me and Every Module It Opens

### D4. The Me page itself
- **Me, scan, settings.** Avatar, name, flag, VIP pill, two level pills, ID with copy button.
- **Friends, Following, Followers, Visitors.** The numbers come from the fixture.
- **Coins card and Points card.** VIP banner.
- **Eight icons:** Reward, Rank, Store, Invite, Guardian, Honor Level, Fan Club, Medal Wall.
- **Two policy banners** in our words. Streamer Center. Builder Center.
- **Help Center, Watch History, Level, Achievement Poster, Bag, My Agency, Redeem Code.**
- **Remove the old duplicate host grid from Me.** Those tools open from Streamer Center.

> **DONE WHEN (D4):** Scrolling Me shows every row from the reference, and every row has a destination.

---

### D5. The screens behind Me
Each destination is a finished layout on fixture data. Use the file that already exists when the catalog says Restyle.

| Opens | Finished Layout Specification |
| :--- | :--- |
| **Friends, Following, Followers, Visitors** | A person row: avatar, name, country, a follow button. Four separate screens. |
| **Coins** | Balance, package grid, history list. |
| **Points** | Balance and a history list. |
| **VIP** | Plan cards, the active plan, history. |
| **Reward** | Task rows and a badge when a fixture task is claimable. |
| **Rank** | A ranked list and the event board. |
| **Store** | Categories and an item page with price and buy. |
| **Bag** | Owned items with an equip control. |
| **Invite** | Code, share, and the people who joined. |
| **Guardian** | Current guardians, a become-guardian panel, and the benefit list. |
| **Honor Level** | Three bars: wealth, shining, honor. |
| **Fan Club** | Club header, join, member list, badge. |
| **Medal Wall** | A grid of earned medals and locked slots. |
| **Streamer Center** | Tasks, task level, starter pack, earning identity, earnings, go live. |
| **Builder Center** | My agency, members, coin seller, withdrawal form with a success state. |
| **Help** | Topics, a contact form, and my tickets. |
| **Watch History** | Rooms with time and a replay row. |
| **Level** | The honor screen. |
| **Achievement Poster** | One card the user can preview. |
| **Redeem Code** | A field. The fixture success code shows a success sheet. Any other code shows the invalid sheet. |
| **Settings and profiles** | Language, blocked people, logout, edit profile, and another person’s profile. |

> **DONE WHEN (D5):** From Me, every row opens a filled screen. Guardian, medals, poster, and redeem are designed, not blank placeholders.

---

## 5. Web Live, Then the Proof

### D6. The light web live page, with the same modules
- **`DiscoveryShell` becomes the light page.**  
  - Left rail: Get the App, Live, Party, Following, Message, Profile.  
  - Top: logo, search, Get Coins, Get the App, desktop icon, avatar.
- **Live shows:** country chips, Live Now, and portrait cards. The name sits under the card. Data is the web fixture, the same rooms as the phone.
- **Party, Following, Message, and Profile** inside this shell use the same layouts as D3 and D4, widened for the desktop. Profile on the web is the same Me design.
- **A card opens the web viewer:** chat and the gift sheet update the fixture. Go Live and taking a party seat show a sheet that points to the phone app, because those cameras stay on the phone. The sheet is designed. The rest of the module is still visible.
- **The marketing homepage, news, policies, and Get Coins stay.** Do not put Admin on this rail.

> **DONE WHEN (D6):** Desktop `/live` matches the light reference, and Party, Message, and Profile on the web are the same modules as the phone.

---

### D7. Walk every module (The 12-Point Acceptance Audit)
Use the filled fixture. Pass a row only when the screen is designed and openable. A blank page fails.

| # | Walk Area | Pass Criteria |
| :---: | :--- | :--- |
| **1** | **Bar and login** | Five icons. Fixture login reaches Explore. |
| **2** | **Explore to viewer** | Three tabs, two tiles, cards, gift sheet, chat. |
| **3** | **Go Live and PK** | Gate through end screen, then PK type, score, and result. |
| **4** | **Party** | Rows, create, 9 seats. |
| **5** | **Message and Square** | Official rows, a thread, a post, comments. |
| **6** | **Me** | Counts, coins, points, eight icons, both centers, seven lower rows. |
| **7** | **People and money** | Four people lists, coins, points, VIP, store, bag. |
| **8** | **Social modules** | Invite, Guardian, Honor, Fan Club, Medal Wall, Reward, Rank. |
| **9** | **Centers** | Streamer Center and Builder Center open every child named in section 4. |
| **10** | **Help to redeem** | Help, history, poster, redeem success, redeem invalid, settings, both profiles. |
| **11** | **Web** | Light rail and the four panels. Same fixture names as the phone. |
| **12** | **Clean** | No reference host name in the fixture. No new database table. Admin is not on the public rail. |

---

## 🏁 Definition of Done

The design is complete when all twelve walks pass on the filled fixture. Every module in section 2 has a screen. Empty and error still exist behind the fixture switch, for the later build. This sequence does not connect those screens to the database.

### AFTER THIS PLAN
The next plan is the database, one module at a time, swapping the fixture for the API. **Do not start that swap until D7 passes. Do not leave a module out of D7 to save time.**

---

### Plan Signoff & Metadata
- **Specification Document:** `Popo-Live-COMPLETE-PRODUCT-DESIGN-v1.1`
- **Date:** 18 November 2026
- **Status:** Active Master Guide
- **Locked Product Rules for Database Plan:**
  - Host share: 70 percent
  - Wealth level 5 required to go live
  - Exactly 9 party seats
  - Age 18+ enforcement
