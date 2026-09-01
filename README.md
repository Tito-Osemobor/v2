# Tito Osemobor — Portfolio v2

An original, server-first one-page portfolio built with Next.js 16, React 19, TypeScript, Tailwind CSS 4, Motion, and Bun. The checked-in content is launch-ready and indexable.

## Local development

Install Bun 1.4.0, then run:

```bash
bun install
cp .env.example .env.local
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

- `RESEND_API_KEY` — server-only Resend API key
- `CONTACT_TO_EMAIL` — private message destination
- `CONTACT_FROM_EMAIL` — verified Resend sender, including a display name if wanted
- `GITHUB_TOKEN` — optional server-only token for higher GitHub API limits

Without Resend configuration, the contact form returns a safe unavailable state. GitHub stars degrade gracefully when the API is unavailable.

## Add projects later

Projects are intentionally configured as `projects: []` in `src/content/site.ts`. An empty list omits the entire section and prevents GitHub API requests. Adding a valid typed project automatically restores the section; add its image under `public/assets/projects`, reference the root-relative path in the content record, and run `bun run content:check`.

## Move DNS from Namecheap hosting to BasicDNS

The message in Namecheap’s **Host Records** area means the domain currently uses Namecheap Web Hosting DNS, so its authoritative records live in cPanel. Because the site is moving from Netlify to Vercel, the recommended long-term setup is Namecheap BasicDNS: it keeps the registrar and DNS management together without retaining cPanel solely for DNS.

Changing nameservers does not copy the current zone. Before switching, open cPanel’s **Zone Editor** and save every record needed for existing email or other services, especially MX, TXT, DKIM, DMARC, CAA, and non-website subdomains. Missing records can interrupt those services.

1. In Namecheap, open **Domain List → Manage → Nameservers**, select **Namecheap BasicDNS**, and save with the checkmark.
2. Open **Advanced DNS**. Recreate every retained non-Netlify record from the cPanel inventory. Do not restore obsolete Netlify website records.
3. Add `titoosemobor.com` and `www.titoosemobor.com` to the Vercel project. Copy the exact DNS records shown by Vercel into Namecheap; use `@` for the apex and `www` for the subdomain. Vercel’s generic values are only examples, so prefer the project dashboard’s current instructions.
4. Preserve all mail-related records unless deliberately replacing that mail service. Wait for DNS propagation, then confirm both hostnames resolve to Vercel before removing any remaining legacy hosting configuration.

Namecheap documents both [switching to BasicDNS](https://www.namecheap.com/support/knowledgebase/article.aspx/782/10/how-do-i-set-my-domain-to-use-namecheap-basicdns/) and [managing Host Records](https://www.namecheap.com/support/knowledgebase/article.aspx/434/2237/how-do-i-set-up-host-records-for-a-domain/). Vercel’s [custom-domain guide](https://vercel.com/docs/domains/set-up-custom-domain) explains how to retrieve the project-specific records.

## Configure Resend after BasicDNS

The contact form can only send from a domain Resend has verified. The default sender in `.env.example` uses `titoosemobor.com`, so that exact domain must be verified before delivery will work.

1. Open the [Resend Domains dashboard](https://resend.com/domains), add `titoosemobor.com`, and leave the domain page open.
2. In Namecheap **Advanced DNS → Host Records**, add every record Resend displays. Copy each type, value, and priority exactly. In Namecheap’s **Host** field, enter only the host portion—such as `send`—rather than the full `send.titoosemobor.com` name. Leave TTL on **Automatic**.
3. Return to Resend and start or restart verification. It often completes quickly, but DNS propagation can take up to 72 hours. Resend's [domain troubleshooting guide](https://resend.com/docs/knowledge-base/what-if-my-domain-is-not-verifying) includes record checks for longer delays.
4. After the domain is verified, open **API Keys**, create a key with **Sending access**, and restrict it to `titoosemobor.com`. Resend displays the secret once, so store it immediately.
5. Add the following to `.env.local` and restart `bun run dev`:

   ```dotenv
   RESEND_API_KEY=re_...
   CONTACT_TO_EMAIL=your-private-inbox@example.com
   CONTACT_FROM_EMAIL=Portfolio <website@titoosemobor.com>
   ```

6. Submit a local test message. A sender/domain validation problem now returns an unavailable state; network, rate-limit, and provider faults return a retryable state without exposing provider details.

For production, add the same variables as server-only Vercel environment variables and redeploy. Never prefix them with `NEXT_PUBLIC_`, commit `.env.local`, or expose the private destination in site content. Resend also provides a dedicated [Namecheap verification guide](https://resend.com/docs/knowledge-base/namecheap).

## Configure the optional GitHub token

Public star counts work without authentication, but a token provides more rate-limit headroom on shared hosting.

1. In GitHub, open **Settings → Developer settings → Personal access tokens → Fine-grained tokens** and choose **Generate new token**.
2. Name it `Portfolio stars`, set an expiration, select the appropriate resource owner, and do not grant private-repository or write access.
3. Keep only read-only **Metadata** repository permission. GitHub's [repository endpoint documentation](https://docs.github.com/en/rest/repos/repos#get-a-repository) describes that permission; public repositories remain readable without authentication.
4. Store the value in `.env.local` and restart the development server:

   ```dotenv
   GITHUB_TOKEN=github_pat_...
   ```

5. Add the same server-only variable to Vercel later. Rotate it before expiration. If it is missing, expired, or rate-limited, project rows still render and simply omit unavailable star counts.

## Quality gates

Use proportional checks during development: run affected unit tests or focused Chromium E2E coverage first, batch typecheck/lint after a coherent feature change, and avoid repeatedly running builds or the full browser matrix. The complete gate below is for a broad final integration pass, not every edit.

```bash
bun run format:check
bun run lint
bun run typecheck
bun run content:check
bun run test
bun run build
bun run test:e2e
```

Playwright's first local run may require `bunx playwright install chromium`.

## Launch checklist

1. Connect this repository to Vercel and verify the preview deployment.
2. Confirm the generated `/social-image` resolves as a 1200×630 image and test its final title, description, image, and canonical URL in LinkedIn Post Inspector after deployment. Preview caches may need to be refreshed.
3. Confirm every favicon and web-app icon renders correctly in a browser tab, an iOS home-screen preview, and an Android/PWA preview.
4. Inventory existing cPanel DNS records, move to BasicDNS, and add Vercel’s project-specific records.
5. Add and verify `titoosemobor.com` in Resend.
6. Configure production environment variables in Vercel and redeploy.
7. Test production contact delivery without exposing the destination address.
8. Optionally verify the domain in Google Search Console and submit `/sitemap.xml` after the site is live.

Deployment, DNS, account creation, and secret configuration are intentionally outside this repository setup.
