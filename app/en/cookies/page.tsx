import { Metadata } from "next";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Cookies Policy | ${siteConfig.name}`,
  description: `Information about the use of cookies at ${siteConfig.name}.`,
};

export default function CookiesPageEn() {
  return (
    <div className="flex flex-col flex-1 bg-white dark:bg-zinc-950 font-sans">
      <main className="flex flex-col max-w-3xl mx-auto w-full px-4 py-12">
        <h1 className="text-4xl font-bold font-serif text-black dark:text-white mb-8">Cookies Policy</h1>
        
        <div className="prose prose-zinc dark:prose-invert prose-lg max-w-none">
          <p>Last updated: {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

          <p>This website, like most websites on the Internet, uses cookies to improve and optimize the user experience. Below, you will find detailed information on what cookies are, what types this website uses, how you can disable them in your browser, and how to specifically block the installation of third-party cookies.</p>
          
          <h2>1. What are cookies?</h2>
          <p>Cookies are files that the website or application you use installs in your browser or on your device during your journey through the pages, and they serve to store information about your visit. Like most sites on the internet, <strong>{siteConfig.name}</strong> uses cookies to:</p>
          <ul>
            <li>Ensure that web pages can function correctly.</li>
            <li>Store your preferences, such as selected language or font size.</li>
            <li>Know your browsing experience.</li>
            <li>Collect anonymous statistical information, such as which pages you have seen or how long you have been in our media.</li>
          </ul>

          <h2>2. Cookies used on this site</h2>
          <p>Below is a table detailing the cookies used on this website:</p>
          
          <div className="overflow-x-auto my-8">
            <table className="min-w-full text-sm text-left border-collapse border border-zinc-200 dark:border-zinc-800">
              <thead className="bg-zinc-50 dark:bg-zinc-900">
                <tr>
                  <th className="p-3 border border-zinc-200 dark:border-zinc-800">Type</th>
                  <th className="p-3 border border-zinc-200 dark:border-zinc-800">Name</th>
                  <th className="p-3 border border-zinc-200 dark:border-zinc-800">Purpose</th>
                  <th className="p-3 border border-zinc-200 dark:border-zinc-800">Provider</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-3 border border-zinc-200 dark:border-zinc-800">Technical</td>
                  <td className="p-3 border border-zinc-200 dark:border-zinc-800">next-themes</td>
                  <td className="p-3 border border-zinc-200 dark:border-zinc-800">Manages dark/light theme preference.</td>
                  <td className="p-3 border border-zinc-200 dark:border-zinc-800">Own</td>
                </tr>
                <tr>
                  <td className="p-3 border border-zinc-200 dark:border-zinc-800">Analytics</td>
                  <td className="p-3 border border-zinc-200 dark:border-zinc-800">_ga, _gid</td>
                  <td className="p-3 border border-zinc-200 dark:border-zinc-800">Collects anonymous information about navigation.</td>
                  <td className="p-3 border border-zinc-200 dark:border-zinc-800">Google Analytics</td>
                </tr>
                <tr>
                  <td className="p-3 border border-zinc-200 dark:border-zinc-800">Advertising</td>
                  <td className="p-3 border border-zinc-200 dark:border-zinc-800">__gads, IDE</td>
                  <td className="p-3 border border-zinc-200 dark:border-zinc-800">Serves ads based on previous visits.</td>
                  <td className="p-3 border border-zinc-200 dark:border-zinc-800">Google AdSense</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2>3. Cookie management</h2>
          <p>By browsing and continuing on our Website, you will be consenting to the use of Cookies in the conditions contained in this Cookies Policy. However, you have the option to exercise your right to block, delete, and reject the use of Cookies at any time through your browser settings.</p>
          
          <p>You can find information on how to manage cookies in the most common browsers at the following links:</p>
          <ul>
            <li><strong>Google Chrome:</strong> <a href="https://support.google.com/chrome/answer/95647?hl=en" target="_blank" rel="noopener noreferrer">Cookie settings</a></li>
            <li><strong>Mozilla Firefox:</strong> <a href="https://support.mozilla.org/en-US/kb/enable-and-disable-cookies-website-preferences" target="_blank" rel="noopener noreferrer">Cookie settings</a></li>
            <li><strong>Internet Explorer:</strong> <a href="https://support.microsoft.com/en-us/help/17442/windows-internet-explorer-delete-manage-cookies" target="_blank" rel="noopener noreferrer">Cookie settings</a></li>
            <li><strong>Safari:</strong> <a href="https://support.apple.com/en-us/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer">Cookie settings</a></li>
          </ul>

          <p>Please note that if you decide to block or delete cookies, we may not be able to maintain your preferences and some features of the website may not be operational, or we may have to ask you again for authorization for their use.</p>
        </div>
      </main>
    </div>
  );
}
