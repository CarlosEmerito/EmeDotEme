import { Metadata } from "next";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Legal Notice | ${siteConfig.name}`,
  description: `Legal information about the website ${siteConfig.name}.`,
};

export default function LegalNoticePageEn() {
  return (
    <div className="flex flex-col flex-1 bg-white dark:bg-zinc-950 font-sans">
      <main className="flex flex-col max-w-3xl mx-auto w-full px-4 py-12">
        <h1 className="text-4xl font-bold font-serif text-black dark:text-white mb-8">Legal Notice</h1>
        
        <div className="prose prose-zinc dark:prose-invert prose-lg max-w-none">
          <p>Last updated: {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

          <p>This Legal Notice regulates the use of the website <strong>{siteConfig.url}</strong> (hereinafter, the Website), owned by <strong>{siteConfig.author}</strong>.</p>
          
          <h2>1. Identification Data</h2>
          <p>In compliance with the duty of information contained in relevant legislation, the following identification data are detailed:</p>
          <ul>
            <li><strong>Owner:</strong> {siteConfig.author}</li>
            <li><strong>Contact email:</strong> carlosemerito13@gmail.com</li>
            <li><strong>Website:</strong> {siteConfig.url}</li>
          </ul>

          <h2>2. Users and Use of the Website</h2>
          <p>Accessing and/or using this portal attributes the status of USER, who accepts, from said access and/or use, the General Conditions of Use reflected here. The Website provides access to a multitude of information, services, programs, or data (hereinafter, &quot;the contents&quot;) on the Internet belonging to <strong>{siteConfig.name}</strong> or its licensors.</p>
          <p>The USER assumes responsibility for the use of the portal. This responsibility extends to the registration that may be necessary to access certain services or contents.</p>

          <h2>3. Intellectual and Industrial Property</h2>
          <p><strong>{siteConfig.name}</strong>, by itself or as an assignee, is the owner of all intellectual and industrial property rights of its website, as well as the elements contained therein (by way of example, images, sound, audio, video, software, or texts; trademarks or logos, color combinations, structure and design, selection of materials used, computer programs necessary for its operation, access, and use, etc.).</p>
          <p>The reproduction, distribution, and public communication, including its modality of making available, of all or part of the contents of this website, for commercial purposes, in any support and by any technical means, without the authorization of <strong>{siteConfig.name}</strong>, are expressly prohibited.</p>

          <h2>4. Exclusion of Warranties and Liability</h2>
          <p><strong>{siteConfig.name}</strong> is not responsible, in any case, for damages of any nature that may cause, by way of example: errors or omissions in the contents, lack of availability of the portal, or the transmission of viruses or malicious or harmful programs in the contents, despite having adopted all necessary technological measures to avoid it.</p>
          <p>The contents of this website are for informational and educational purposes. They do not constitute financial, legal, or professional advice of any kind.</p>

          <h2>5. Modifications</h2>
          <p><strong>{siteConfig.name}</strong> reserves the right to make the modifications it deems appropriate in its portal without prior notice, being able to change, delete, or add both the contents and services provided through it and the way they are presented or located in its portal.</p>

          <h2>6. Third-Party Links</h2>
          <p>In the event that the Website provides links or hyperlinks to other Internet sites, <strong>{siteConfig.name}</strong> shall not exercise any type of control over said sites and contents. In no case shall it assume any responsibility for the contents of any link belonging to a third-party website.</p>
        </div>
      </main>
    </div>
  );
}
