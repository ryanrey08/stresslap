import { absoluteUrl, site } from "@/lib/site";

/**
 * Schema.org JSON-LD for the home page. Only facts that are true of the app are listed:
 * no ratings, reviews, prices or organisation details are claimed.
 */
export function StructuredData() {
  const url = absoluteUrl("/");
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${url}#website`,
        name: site.name,
        alternateName: site.socialTitle,
        url,
        description: site.description,
        inLanguage: site.language,
      },
      {
        "@type": "WebApplication",
        "@id": `${url}#app`,
        name: site.name,
        url,
        description: site.appDescription,
        applicationCategory: "GameApplication",
        applicationSubCategory: "Interactive stress-relief game",
        genre: ["Entertainment", "Casual game"],
        operatingSystem: "Any (runs in a web browser)",
        browserRequirements:
          "Requires JavaScript and WebAssembly. Works in current versions of Chrome, Edge, Firefox and Safari on desktop and mobile.",
        inLanguage: site.language,
        isAccessibleForFree: true,
        image: [absoluteUrl("/icon-512.png"), absoluteUrl(site.ogImage.url)],
        featureList: [
          "Upload a JPG, PNG or WEBP photo",
          "Automatic face detection that runs locally in the browser",
          "Cartoon slap, punch and kick animations",
          "Animated facial reactions and comic sound effects",
          "Download the edited photo as a PNG",
          "Photos are never uploaded or stored",
        ],
        isPartOf: { "@id": `${url}#website` },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      // escape "<" so the JSON can never close the script tag
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
