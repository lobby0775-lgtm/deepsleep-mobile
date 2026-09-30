# Where the COE numbers come from

The app compiles market figures into `src/calc/defaults.ts`. COE premiums move
twice a month, so those numbers need checking. This file records what was tried
so the next person doesn't repeat the search.

## Feeds tried on 30 Sep 2026

| URL | Result |
| --- | --- |
| `https://api-open.lta.gov.sg/v1/coes/Result` | NXDOMAIN — the name does not resolve at all (authoritative NXDOMAIN from gov DNS, not a 404). This endpoint does not exist. |
| `https://www.mot.gov.sg/vehicles/buying-a-vehicle/coe/coe-results` | 404 |
| `https://www.mot.gov.sg/vehicles/buying-a-vehicle/vehicle-registration/coe` | 404 |
| `https://www.mot.gov.sg/vehicles/buying-a-vehicle` | 404 |
| `https://www.mot.gov.sg/vehicles/coe/` | 404 |
| `https://www.mot.gov.sg/sitemap.xml` | 200, but every `coe` URL in it is a `news-resources/newsroom/` press release. No consumer-facing COE results page is listed. |
| `https://www.mot.gov.sg/search/?q=…` | 200, renders results inside a `search.gov.sg` iframe that needs a per-site API token; not machine-readable. |
| `https://onemotoring.lta.gov.sg/content/onemotoring/home.html` | 200. COE pages under `/content/onemotoring/coe/` and `/content/onemotoring/vehicle-registration/` all 404. |
| `https://eservice.mot.gov.sg/…` | connection fails outright (no response, not a status code) |
| `https://datasearch.data.gov.sg/api/action/package_search?q=coe` | empty response |
| `https://api-open.data.gov.sg/v1/public/api/datasets?query=…` | `{"code":28,"name":"NOT_FOUND"}` |

## Reading

MOT appears to have moved vehicle-registration content off its old paths, and
the COE result figures that were once served from a public endpoint are not
currently reachable from an unauthenticated request. The likely places to look
next, in order of effort:

1. **oneMotoring, logged in.** The COE premium table is rendered inside the
   signed-in portal. Automating that needs a session, which is a different
   (and much more fragile) proposition than a cron job.
2. **A public dataset on data.gov.sg.** Worth browsing by hand — the API
   routes probed above are not the right ones, but the catalogue is searchable
   in a browser.
3. **A third-party mirror.** Sites that republish COE results do so, but they
   are not authoritative and one of them being wrong would be our problem.

## What this means for the app

Until a source is confirmed, the numbers in `defaults.ts` carry
`DATA_AS_OF = '26 Sep 2026'`, which the site states in the footer. If that
becomes wrong, the fix is a one-line edit plus a rebuild:

```
COE_LATEST        in src/calc/defaults.ts
DATA_AS_OF        in src/calc/defaults.ts
COE_LATEST_LABEL  in src/calc/defaults.ts
```

`node scripts/check-lta.mjs` exists to automate that check. It currently exits
**2 (could not verify)**, not 1, so a caller can distinguish a broken checker
from real drift. Once a feed is confirmed, add it to `CANDIDATE_FEEDS` in that
script and the same code path starts alerting.

The calculator takes the COE premium as a user-editable field and shows the
compiled figure as its default, so a stale number degrades to "wrong starting
point the user can fix" rather than "wrong answer the user can't see".
