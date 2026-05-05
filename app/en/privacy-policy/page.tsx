import { Metadata } from "next";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Privacy Policy | ${siteConfig.name}`,
  description: `Learn how we treat your personal data at ${siteConfig.name}.`,
};

export default function PrivacyPageEn() {
  return (
    <div className="flex flex-col flex-1 bg-white dark:bg-zinc-950 font-sans">
      <main className="flex flex-col max-w-3xl mx-auto w-full px-4 py-12">
        <h1 className="text-4xl font-bold font-serif text-black dark:text-white mb-8">Privacy Policy</h1>
        
        <div className="prose prose-zinc dark:prose-invert prose-lg max-w-none">
          <p>Last updated: {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          
          <p>At <strong>{siteConfig.name}</strong>, we value our users' privacy and are committed to protecting their personal data. This Privacy Policy describes how we collect, use, and protect your information in accordance with the General Data Protection Regulation (GDPR) and relevant data protection laws.</p>

          <h2>1. Data Controller</h2>
          <p>The controller for the personal data collected through this website is:</p>
          <ul>
            <li><strong>Identity:</strong> {siteConfig.author}</li>
            <li><strong>Email:</strong> carlosemerito13@gmail.com</li>
            <li><strong>Activity:</strong> Disclosure of news on technology, cryptocurrencies, and markets.</li>
          </ul>

          <h2>2. Purpose of Treatment</h2>
          <p>We process the information provided by interested persons for the following purposes:</p>
          <ul>
            <li><strong>Subscription management:</strong> Manage the sending of our newsletter and commercial communications to which the user has subscribed.</li>
            <li><strong>Contact and support:</strong> Attend to queries, requests, or suggestions sent through our contact form.</li>
            <li><strong>Experience improvement:</strong> Analyze user navigation to optimize the usability and content of the website.</li>
            <li><strong>Advertising:</strong> Manage advertising spaces on the website according to the user's interests.</li>
          </ul>

          <h2>3. Legal Basis for Processing</h2>
          <p>The legal basis for processing your data varies depending on the purpose:</p>
          <ul>
            <li><strong>Consent:</strong> For subscription to the newsletter and sending queries through the form.</li>
            <li><strong>Legitimate interest:</strong> For performing statistical analysis and improving the website.</li>
            <li><strong>Compliance with legal obligations:</strong> In case it is necessary to comply with current legislation.</li>
          </ul>

          <h2>4. Data Retention</h2>
          <p>Personal data will be kept as long as the relationship with the user is maintained or until the user requests its deletion, and in any case, during the mandatory legal periods.</p>

          <h2>5. Data Recipients</h2>
          <p>Data will not be transferred to third parties, except for legal obligation or for the provision of services necessary for the operation of the website, such as:</p>
          <ul>
            <li><strong>Email service providers (Resend):</strong> For sending the newsletter.</li>
            <li><strong>Google LLC (Analytics/AdSense):</strong> For traffic analysis and advertising management (subject to Google's privacy policies).</li>
            <li><strong>Hosting Providers (Vercel/Supabase):</strong> For hosting the site and database.</li>
          </ul>

          <h2>6. International Transfers</h2>
          <p>Some of our providers (such as Google or Resend) may be located in countries outside the European Economic Area. In such cases, we ensure that appropriate safeguards exist, such as standard contractual clauses or recognized privacy frameworks.</p>

          <h2>7. Your Rights</h2>
          <p>As an interested party, you have the right to:</p>
          <ul>
            <li>Access your personal data.</li>
            <li>Request the rectification of inaccurate data.</li>
            <li>Request its deletion when no longer necessary.</li>
            <li>Request the limitation or opposition to its treatment.</li>
            <li>Request the portability of your data.</li>
          </ul>
          <p>You can exercise these rights by sending an email to carlosemerito13@gmail.com, attaching a copy of your ID or equivalent document to verify your identity.</p>

          <p>If you consider that your rights have not been duly addressed, you have the right to file a claim with the relevant Data Protection Authority.</p>
        </div>
      </main>
    </div>
  );
}
