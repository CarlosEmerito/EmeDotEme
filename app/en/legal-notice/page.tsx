import { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Legal Notice | ${siteConfig.name}`,
  description: `Legal information about ${siteConfig.name}.`,
  robots: { index: false, follow: true },
};

export default function LegalNoticePage() {
  return (
    <div className="flex flex-col flex-1 bg-white dark:bg-zinc-950 font-sans">
      <main className="flex flex-col max-w-3xl mx-auto w-full px-4 py-12">
        <h1 className="text-4xl font-bold font-serif text-black dark:text-white mb-8">Legal Notice</h1>

        <div className="prose prose-zinc dark:prose-invert prose-lg max-w-none">
          <p>Last updated: 8 October 2026</p>

          <p>This Legal Notice governs the use of the website <strong>{siteConfig.url}</strong> (the &quot;Website&quot;), owned by <strong>{siteConfig.author}</strong>.</p>

          <h2>1. Identifying details</h2>
          <p>In compliance with the information duty set out in article 10 of Spanish Law 34/2002 on Information Society Services and Electronic Commerce:</p>
          <ul>
            <li><strong>Owner:</strong> {siteConfig.author}</li>
            <li><strong>Contact email:</strong> carlosemerito13@gmail.com</li>
            <li><strong>Website:</strong> {siteConfig.url}</li>
          </ul>

          <h2>2. Users</h2>
          <p>Accessing or using this Website grants you the status of USER and implies acceptance of these terms. The USER is responsible for their use of the Website.</p>

          <h2>3. Content, sources and images</h2>
          <p>
            This publication reports on information drawn from <strong>news articles published by
            third parties</strong>. Every article credits and links to the original source at the
            end, so readers can read the full coverage at the outlet that produced it. That link is
            the way this Website refers to other people&apos;s work.
          </p>
          <p>
            <strong>This Website does not reproduce or reuse images from other media outlets.</strong>{" "}
            Images illustrating articles come only from:
          </p>
          <ul>
            <li><strong>AI generation</strong>, when no suitable licensed photograph is available.</li>
            <li><strong>Stock libraries with a commercial licence</strong> (for example Pixabay), which authorise use without further permission.</li>
            <li><strong>Our own material.</strong></li>
          </ul>
          <p>
            If you hold rights over any content and believe its use is not appropriate, write to{" "}
            <strong>carlosemerito13@gmail.com</strong> and we will review it and, where appropriate,
            remove it.
          </p>

          <h2>4. Use of artificial intelligence</h2>
          <p>
            Articles on this Website are written with the support of{" "}
            <strong>artificial intelligence systems</strong>, based on the cited sources. The
            resulting draft is <strong>never published without review</strong>: it goes through the
            control and approval of the editor responsible, who decides article by article what is
            published and what is not. That is why articles do not carry an individual AI-generated
            notice (the exception in article 50.4 of Regulation (EU) 2024/1689, which requires human
            review and editorial responsibility — the case here).
          </p>
          <p>
            Authorship and responsibility rest with the editor responsible identified in section 1.
            The production process and the detail of this point are described in our{" "}
            <Link href="/en/editorial-policy">Editorial Policy</Link>.
          </p>

          <h2>5. Intellectual property</h2>
          <p>
            <strong>{siteConfig.name}</strong> owns the intellectual property rights over the
            elements it has created for this Website: its code, design, structure, texts, brands and
            logos.
          </p>
          <p>
            <strong>That ownership does not extend to third-party content.</strong> Trademarks,
            logos and trade names of companies mentioned in our reporting belong to their respective
            owners and are used for information purposes only. Photographs from licensed stock
            libraries are used under the terms of those licences.
          </p>
          <p>
            Reproduction, distribution or public communication of this Website&apos;s own content for
            commercial purposes is prohibited without authorisation from{" "}
            <strong>{siteConfig.name}</strong>. Linking to this Website and quoting excerpts with
            attribution are free.
          </p>

          <h2>6. Disclaimer</h2>
          <p>
            <strong>{siteConfig.name}</strong> accepts no liability for damages of any kind arising
            from errors or omissions in the content, unavailability of the site, or the transmission
            of malicious code, despite having adopted the necessary technical measures to prevent it.
          </p>
          <p>
            Content on this Website is informational. <strong>It is not financial, legal or
            professional advice.</strong> Investment decisions are the reader&apos;s sole
            responsibility.
          </p>
          <p>
            This Website includes affiliate links and advertising. Their presence does not influence
            editorial content and they are identified as such on the page.
          </p>

          <h2>7. Changes</h2>
          <p><strong>{siteConfig.name}</strong> may modify, remove or add content and services without prior notice.</p>

          <h2>8. Third-party links</h2>
          <p><strong>{siteConfig.name}</strong> exercises no control over third-party sites linked from this Website and accepts no liability for their content.</p>

          <p>
            See also: <Link href="/en/editorial-policy">Editorial Policy</Link>,{" "}
            <Link href="/en/privacy-policy">Privacy Policy</Link> and{" "}
            <Link href="/en/cookies">Cookie Policy</Link>.
          </p>
        </div>
      </main>
    </div>
  );
}
