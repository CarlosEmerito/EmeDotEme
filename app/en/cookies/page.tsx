import { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { CookieSettingsLink } from "@/components/layout/consent";

export const metadata: Metadata = {
  title: `Cookie Policy | ${siteConfig.name}`,
  description: `How ${siteConfig.name} uses cookies and local storage.`,
  robots: { index: false, follow: true },
};

const CELL = "p-3 border border-zinc-200 dark:border-zinc-800";

export default function CookiesPage() {
  return (
    <div className="flex flex-col flex-1 bg-white dark:bg-zinc-950 font-sans">
      <main className="flex flex-col max-w-3xl mx-auto w-full px-4 py-12">
        <h1 className="text-4xl font-bold font-serif text-black dark:text-white mb-8">Cookie Policy</h1>

        <div className="prose prose-zinc dark:prose-invert prose-lg max-w-none">
          <p>Last updated: 8 October 2026</p>

          <h2>1. How consent works on this site</h2>
          <p>
            <strong>Nothing non-essential is stored before you decide.</strong> On your first visit a
            notice appears with two options: <em>&quot;Accept all&quot;</em> and{" "}
            <em>&quot;Essential only&quot;</em>. They are equally prominent, and the second does not
            degrade your experience: the site works exactly the same.
          </p>
          <p>You can change your mind at any time. This button reopens the notice:</p>
          <p>
            <CookieSettingsLink className="inline-block px-4 py-2 text-sm font-semibold rounded-md border border-zinc-300 dark:border-zinc-600 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors" />
          </p>
          <p>
            Your choice is stored in your browser&apos;s local storage under the key{" "}
            <code>eme-cookie-consent-v1</code>. It is not a cookie and is never sent to a server.
          </p>

          <h2>2. What a cookie is</h2>
          <p>
            Cookies are files a website stores in your browser. Some are essential for the page to
            work; others measure audience or serve advertising. On this site, most of what would
            normally rely on cookies uses <strong>local storage</strong> instead, which is never sent
            to the server.
          </p>

          <h2>3. Exactly what this site uses</h2>

          <h3>First-party storage (always on)</h3>
          <div className="overflow-x-auto my-6">
            <table className="min-w-full text-sm text-left border-collapse border border-zinc-200 dark:border-zinc-800">
              <thead className="bg-zinc-50 dark:bg-zinc-900">
                <tr>
                  <th className={CELL}>Name</th>
                  <th className={CELL}>Type</th>
                  <th className={CELL}>Purpose</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={CELL}><code>theme</code></td>
                  <td className={CELL}>Local storage</td>
                  <td className={CELL}>Remembers your light/dark preference.</td>
                </tr>
                <tr>
                  <td className={CELL}><code>eme-cookie-consent-v1</code></td>
                  <td className={CELL}>Local storage</td>
                  <td className={CELL}>Remembers your cookie choice so we don&apos;t ask again.</td>
                </tr>
                <tr>
                  <td className={CELL}><code>session</code></td>
                  <td className={CELL}>Session cookie</td>
                  <td className={CELL}>Admin panel only. No visitor ever receives it.</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>These three are strictly necessary to run the site or to honour your decision, so they do not require consent.</p>

          <h3>Audience measurement (always on, no cookies)</h3>
          <p>
            We use <strong>Vercel Analytics</strong> and <strong>Vercel Speed Insights</strong>. They{" "}
            <strong>set no cookies and do not identify individuals</strong>: visits are grouped with
            an anonymous identifier derived from the request, which rotates daily and cannot follow
            you across sites. That is why they run without asking for permission.
          </p>

          <h3>Advertising and third parties (consent only)</h3>
          <div className="overflow-x-auto my-6">
            <table className="min-w-full text-sm text-left border-collapse border border-zinc-200 dark:border-zinc-800">
              <thead className="bg-zinc-50 dark:bg-zinc-900">
                <tr>
                  <th className={CELL}>Provider</th>
                  <th className={CELL}>Purpose</th>
                  <th className={CELL}>When it loads</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={CELL}><strong>Google AdSense</strong></td>
                  <td className={CELL}>
                    Serving ads and, where applicable, personalising them based on your browsing. It
                    sets its own and third-party advertising cookies (including <code>__gads</code>{" "}
                    and <code>IDE</code>).
                  </td>
                  <td className={CELL}><strong>Only if you press &quot;Accept all&quot;</strong></td>
                </tr>
                <tr>
                  <td className={CELL}><strong>A-ADS</strong></td>
                  <td className={CELL}>
                    Serving a sidebar ad slot. Its provider states it uses no tracking cookies.
                  </td>
                  <td className={CELL}><strong>Only if you press &quot;Accept all&quot;</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            <strong>If you decline:</strong> Google ads and the A-ADS slot are not loaded at all. You
            still get the full site; you simply won&apos;t see those ad blocks. No profiling takes
            place.
          </p>

          <h2>4. Managing them from your browser</h2>
          <ul>
            <li><strong>Google Chrome:</strong> <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">Cookie settings</a></li>
            <li><strong>Mozilla Firefox:</strong> <a href="https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop" target="_blank" rel="noopener noreferrer">Cookie settings</a></li>
            <li><strong>Safari:</strong> <a href="https://support.apple.com/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer">Cookie settings</a></li>
            <li><strong>Microsoft Edge:</strong> <a href="https://support.microsoft.com/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer">Cookie settings</a></li>
          </ul>

          <h2>5. Legal basis</h2>
          <p>
            Non-essential storage requires your prior consent under article 22.2 of Spanish Law
            34/2002 (LSSI) and the guidelines of the Spanish Data Protection Agency (AEPD).
            Strictly necessary storage is exempt. See how we handle personal data in our{" "}
            <a href="/en/privacy-policy">Privacy Policy</a>.
          </p>
        </div>
      </main>
    </div>
  );
}
