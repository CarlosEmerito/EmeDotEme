import { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Privacy Policy | ${siteConfig.name}`,
  description: `How we handle your personal data at ${siteConfig.name}.`,
  robots: { index: false, follow: true },
};

export default function PrivacyPage() {
  return (
    <div className="flex flex-col flex-1 bg-white dark:bg-zinc-950 font-sans">
      <main className="flex flex-col max-w-3xl mx-auto w-full px-4 py-12">
        <h1 className="text-4xl font-bold font-serif text-black dark:text-white mb-8">Privacy Policy</h1>

        <div className="prose prose-zinc dark:prose-invert prose-lg max-w-none">
          <p>Last updated: 8 October 2026</p>

          <p>At <strong>{siteConfig.name}</strong> we take privacy seriously. This policy explains what we collect, why, and what you can demand, under the GDPR and Spanish Organic Law 3/2018 (LOPDGDD).</p>

          <h2>1. Data controller</h2>
          <ul>
            <li><strong>Identity:</strong> {siteConfig.author}</li>
            <li><strong>Email:</strong> carlosemerito13@gmail.com</li>
            <li><strong>Activity:</strong> Reporting on technology, cryptocurrencies and markets.</li>
          </ul>

          <h2>2. What we process and why</h2>
          <ul>
            <li><strong>Newsletter subscription:</strong> your email address and the date and time of subscription, to send the newsletter and handle unsubscription.</li>
            <li><strong>Contact form:</strong> whatever you include in your message, to reply to your enquiry.</li>
            <li><strong>Audience measurement:</strong> <strong>aggregated, anonymous</strong> browsing data (pages viewed, time on page, approximate country), with no individual identification.</li>
          </ul>
          <p>
            <strong>We do not profile users</strong>, build commercial profiles, or make automated
            decisions affecting you.
          </p>

          <h2>3. Legal basis</h2>
          <ul>
            <li><strong>Consent</strong> (art. 6.1.a GDPR): newsletter subscription, contact form enquiries, and loading third-party advertising cookies. You may withdraw it at any time without affecting the lawfulness of prior processing.</li>
            <li><strong>Legitimate interest</strong> (art. 6.1.f GDPR): aggregated anonymous audience measurement, site security and abuse prevention.</li>
            <li><strong>Legal obligation</strong> (art. 6.1.c GDPR): where necessary to respond to legal requirements.</li>
          </ul>

          <h2>4. How long we keep data</h2>
          <ul>
            <li><strong>Newsletter:</strong> until you unsubscribe. On unsubscription your address is deleted from the sending database.</li>
            <li><strong>Contact:</strong> as long as needed to answer, then no more than one year.</li>
            <li><strong>Audience measurement:</strong> aggregated; cannot identify you.</li>
          </ul>

          <h2>5. Recipients and processors</h2>
          <p>We do not sell or share data with third parties except where legally required. We use these providers, which process data on our behalf under a data processing agreement:</p>
          <ul>
            <li><strong>Vercel Inc.:</strong> website hosting and cookieless audience measurement.</li>
            <li><strong>Supabase Inc.:</strong> article database and image storage.</li>
            <li><strong>Resend:</strong> newsletter delivery.</li>
            <li><strong>Cloudflare, Inc.:</strong> AI generation of illustrative images.</li>
            <li><strong>Pixabay (Canva):</strong> search for commercially licensed photographs.</li>
            <li><strong>Google LLC:</strong> only if you accept advertising cookies, for AdSense ad slots.</li>
          </ul>

          <h2>6. International transfers</h2>
          <p>Some providers are located outside the European Economic Area, mainly in the United States. Those transfers rely on:</p>
          <ul>
            <li>The <strong>EU-US Data Privacy Framework</strong>, for certified providers.</li>
            <li>The <strong>Standard Contractual Clauses</strong> approved by the European Commission, with an assessment of applicable supplementary measures.</li>
          </ul>
          <p>You can request details of the safeguards applied by writing to the address in section 1.</p>

          <h2>7. Your rights</h2>
          <ul>
            <li>Access your personal data.</li>
            <li>Request rectification of inaccurate data.</li>
            <li>Request erasure when it is no longer needed.</li>
            <li>Request restriction of or objection to processing.</li>
            <li>Request data portability.</li>
            <li>Withdraw your consent at any time.</li>
          </ul>
          <p>
            Email <strong>carlosemerito13@gmail.com</strong> to exercise them. To unsubscribe from
            the newsletter, just use the link at the bottom of every email.
          </p>
          <p>
            If you believe your rights have not been properly handled, you may lodge a complaint with
            the <strong>Spanish Data Protection Agency</strong> (AEPD),{" "}
            <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer">www.aepd.es</a>.
          </p>

          <h2>8. Minors</h2>
          <p>
            This site is not directed at children under 14. Newsletter subscription requires being at
            least that age, and if we detect a subscription by a minor without parental authorisation
            we will delete it.
          </p>

          <h2>9. Security</h2>
          <p>
            We apply reasonable technical and organisational measures: encryption in transit, access
            control on the database, and limiting the data processed to what is strictly necessary.
          </p>

          <p>
            See also: <Link href="/en/cookies">Cookie Policy</Link>,{" "}
            <Link href="/en/legal-notice">Legal Notice</Link> and{" "}
            <Link href="/en/editorial-policy">Editorial Policy</Link>.
          </p>
        </div>
      </main>
    </div>
  );
}
