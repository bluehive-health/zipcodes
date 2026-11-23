#!/usr/bin/env node
// Turns the client build into a fully static page:
//   - renders the React app to HTML so crawlers and AI agents see real content
//   - writes the <head> SEO tags and JSON-LD structured data from src/content.ts
//   - writes llms.txt, llms-full.txt and sitemap.xml
import { readFileSync, rmSync, writeFileSync } from 'node:fs';

const websiteRoot = new URL('../', import.meta.url);
const repoRoot = new URL('../../', import.meta.url);
const dist = new URL('dist/', websiteRoot);

const { render, site, faq, api } = await import(new URL('dist-ssr/entry-server.js', websiteRoot).href);
const pkg = JSON.parse(readFileSync(new URL('package.json', repoRoot), 'utf8'));
// The publish workflow stamps the release version into package.json; the site
// deploy passes it in so the page reports the version that was just released.
const version = process.env.SITE_VERSION || pkg.version;
const today = new Date().toISOString().slice(0, 10);

const escapeHtml = (text) =>
    text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const jsonLd = [
    {
        '@context': 'https://schema.org',
        '@type': 'SoftwareSourceCode',
        '@id': `${site.url}/#software`,
        name: site.name,
        alternateName: ['zipcodes', '@bluehive-health/zipcodes'],
        description: site.description,
        url: site.url,
        codeRepository: site.github,
        programmingLanguage: ['TypeScript', 'JavaScript'],
        runtimePlatform: 'Node.js',
        license: 'https://opensource.org/license/bsd-3-clause',
        version,
        keywords: pkg.keywords.join(', '),
        isAccessibleForFree: true,
        author: { '@id': `${site.url}/#org` },
        maintainer: { '@id': `${site.url}/#org` },
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    },
    {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        '@id': `${site.url}/#org`,
        name: 'BlueHive Health',
        url: site.bluehive,
        sameAs: ['https://github.com/bluehive-health'],
    },
    {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: site.name,
        url: site.url,
        description: site.description,
        publisher: { '@id': `${site.url}/#org` },
    },
    {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faq.map((item) => ({
            '@type': 'Question',
            name: item.q,
            acceptedAnswer: { '@type': 'Answer', text: item.a },
        })),
    },
    {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name: 'How to look up a US ZIP code in Node.js',
        step: [
            { '@type': 'HowToStep', name: 'Install the package', text: `Run ${site.install}` },
            {
                '@type': 'HowToStep',
                name: 'Import a function',
                text: "Add: import { lookup } from '@bluehive/zipcodes';",
            },
            {
                '@type': 'HowToStep',
                name: 'Look up a ZIP code',
                text: "Call lookup('90210') to get { zip, city, state, latitude, longitude, country }.",
            },
        ],
    },
];

const head = `<title>${escapeHtml(site.title)}</title>
        <meta name="description" content="${escapeHtml(site.description)}" />
        <meta name="keywords" content="${escapeHtml(pkg.keywords.join(', '))}" />
        <link rel="canonical" href="${site.url}/" />
        <link rel="alternate" type="text/markdown" href="${site.url}/llms-full.txt" title="Documentation as Markdown" />
        <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="${escapeHtml(site.name)}" />
        <meta property="og:title" content="${escapeHtml(site.title)}" />
        <meta property="og:description" content="${escapeHtml(site.description)}" />
        <meta property="og:url" content="${site.url}/" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="${escapeHtml(site.title)}" />
        <meta name="twitter:description" content="${escapeHtml(site.description)}" />
        ${jsonLd
            .map((data) => `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`)
            .join('\n        ')}`;

const indexFile = new URL('index.html', dist);
const template = readFileSync(indexFile, 'utf8');
for (const marker of ['<!--seo-head-->', '<!--app-html-->']) {
    if (!template.includes(marker)) {
        throw new Error(`index.html is missing the ${marker} marker`);
    }
}
const appHtml = render();
writeFileSync(indexFile, template.replace('<!--seo-head-->', () => head).replace('<!--app-html-->', () => appHtml));

// --- llms.txt / llms-full.txt -------------------------------------------------
// llms.txt is the repo's own file, so the npm package, GitHub and the site agree.
const llms = readFileSync(new URL('llms.txt', repoRoot), 'utf8');
writeFileSync(new URL('llms.txt', dist), llms);

const readme = readFileSync(new URL('README.md', repoRoot), 'utf8');
const faqMarkdown = faq.map((item) => `### ${item.q}\n\n${item.a}`).join('\n\n');
const apiMarkdown = api
    .map(
        (entry) =>
            `### ${entry.name}\n\n\`\`\`ts\n${entry.signature}\n\`\`\`\n\n${entry.summary}${entry.details ? ` ${entry.details}` : ''}\n\n\`\`\`js\n${entry.example}\n\`\`\``,
    )
    .join('\n\n');
writeFileSync(
    new URL('llms-full.txt', dist),
    `<!-- ${site.name} ${version}: complete documentation. Source: ${site.url} and ${site.github} -->\n\n` +
        `${readme.trim()}\n\n---\n\n## API reference with examples\n\n${apiMarkdown}\n\n---\n\n## Frequently asked questions\n\n${faqMarkdown}\n`,
);

writeFileSync(
    new URL('sitemap.xml', dist),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
        `    <url>\n        <loc>${site.url}/</loc>\n        <lastmod>${today}</lastmod>\n    </url>\n</urlset>\n`,
);

rmSync(new URL('dist-ssr/', websiteRoot), { recursive: true, force: true });
console.log(`Prerendered ${site.url}/ (${(appHtml.length / 1024).toFixed(0)} kB of HTML) for version ${version}`);
