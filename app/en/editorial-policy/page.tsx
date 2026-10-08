import { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Editorial Policy | ${siteConfig.name}`,
  description: `How information is produced, checked and published at ${siteConfig.name}.`,
};

export default function EditorialPolicyPage() {
  return (
    <div className="flex flex-col flex-1 bg-white dark:bg-zinc-950 font-sans">
      <main className="flex flex-col max-w-3xl mx-auto w-full px-4 py-12">
        <h1 className="text-4xl font-bold font-serif text-black dark:text-white mb-8">Editorial Policy</h1>

        <div className="prose prose-zinc dark:prose-invert prose-lg max-w-none">
          <p>Last updated: 8 October 2026</p>

          <p>
            This page explains <strong>who is accountable</strong> for what is published here,{" "}
            <strong>how it is produced</strong>, and <strong>what you can hold us to</strong>.
          </p>

          <h2>1. Editorial responsibility</h2>
          <p>
            The person responsible for the content published on {siteConfig.name} is{" "}
            <strong>{siteConfig.author}</strong>, reachable at{" "}
            <strong>carlosemerito13@gmail.com</strong>. That is who to contact for any correction,
            complaint or rights notice regarding what we publish.
          </p>

          <h2>2. How information is produced</h2>
          <p>
            We work with an <strong>automated system</strong> that, from news articles published by
            other outlets, writes and publishes current-affairs coverage on cryptocurrencies,
            markets, artificial intelligence and cybersecurity:
          </p>
          <ol>
            <li>We consult a verifiable list of reference outlets.</li>
            <li>A language model writes the article in Spanish and its English version.</li>
            <li>The text passes automated form and content checks.</li>
            <li>An image is selected under section 4 of this policy.</li>
            <li>The article is published with <strong>the original source credited and linked</strong> at the end.</li>
          </ol>
          <p>
            <strong>We do not republish text from other outlets.</strong> Every article is written
            from scratch and always links to the original coverage, where you can read the work of
            the outlet that produced it.
          </p>

          <h2>3. Use of artificial intelligence</h2>
          <p>
            Articles are written with the support of <strong>artificial intelligence systems</strong>:
            a language model prepares the draft from the cited sources. That draft is{" "}
            <strong>never published as it stands</strong>: it goes through the review and approval of
            the editor responsible named in section 1, who decides article by article whether it is
            published, discarded or rewritten.
          </p>
          <p>
            That is why articles do not carry an individual AI-generated notice: the exception in
            article 50.4 of Regulation (EU) 2024/1689 applies where the content has undergone human
            review and a person holds editorial responsibility for the publication, which is the case
            here. Every review and its outcome are recorded.
          </p>
          <p>
            <strong>Authorship and responsibility rest with the editor named in section 1.</strong>{" "}
            Artificial intelligence is a drafting tool, not the author of the information.
          </p>

          <h2>4. Images</h2>
          <p>
            <strong>We do not use images from other news outlets.</strong> Every image comes from one
            of three sources:
          </p>
          <ul>
            <li><strong>AI generation</strong>, when no suitable licensed photograph is available.</li>
            <li><strong>Stock libraries with a commercial licence</strong> authorising use without further permission.</li>
            <li><strong>Our own material.</strong></li>
          </ul>
          <p>
            The reason is simple: third-party images require the rights holder&apos;s permission, and
            we do not have it. When a story needs an image we cannot obtain through those routes, we
            generate an illustration and say that it is an illustration.
          </p>

          <h2>5. Advertising and commercial content</h2>
          <p>
            This site is funded by advertising and affiliate links. Both are labelled as such.{" "}
            <strong>Advertising does not influence editorial content</strong>: no advertiser reviews
            or approves articles, and we do not publish content for payment without disclosing it.
          </p>

          <h2>6. Corrections</h2>
          <p>
            An automated system can be wrong. If you spot an error, write to{" "}
            <strong>carlosemerito13@gmail.com</strong> with the article and the detail you believe is
            incorrect. We commit to:
          </p>
          <ul>
            <li>Reviewing it and correcting the article if the error is confirmed.</li>
            <li>Noting the correction where the change is substantive.</li>
            <li>Removing content that affects third-party rights and cannot be corrected.</li>
          </ul>
          <p>
            If you hold rights over any content and believe its use is not appropriate, contact us
            the same way. We will remove or replace it while we review.
          </p>

          <h2>7. Our commitments</h2>
          <ul>
            <li>Not publish information we cannot attribute to an identifiable source.</li>
            <li>Always link to the outlet that published the original reporting.</li>
            <li>Publish only content reviewed and approved by the editor responsible.</li>
            <li>Not use third-party images or text without permission or a licence.</li>
            <li>Keep advertising separate from editorial content.</li>
            <li>Correct errors when they are pointed out to us.</li>
          </ul>

          <p>
            See also: <Link href="/en/legal-notice">Legal Notice</Link>,{" "}
            <Link href="/en/privacy-policy">Privacy Policy</Link> and{" "}
            <Link href="/en/cookies">Cookie Policy</Link>.
          </p>
        </div>
      </main>
    </div>
  );
}
