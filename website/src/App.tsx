import { Badge } from '@mieweb/ui/components/Badge';
import { buttonVariants } from '@mieweb/ui/components/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@mieweb/ui/components/Card';
import { CopyButton } from '@mieweb/ui/components/CopyButton';
import { CodeBlock } from '@mieweb/ui/components/Markdown';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@mieweb/ui/components/Tabs';
import { ThemeProvider, ThemeToggle } from '@mieweb/ui/components/ThemeProvider';
import { ArrowRight, BookOpen, Github, MapPin, Package } from 'lucide-react';
import { Playground } from './components/Playground';
import { Section } from './components/Section';
import { api, dataSources, faq, features, highlights, nav, quickStart, site, zipCodeType } from './content';

function Header() {
    return (
        <header className="border-border bg-background/90 sticky top-0 z-40 border-b backdrop-blur">
            <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
                <a href="#top" className="text-foreground flex items-center gap-2 text-lg font-extrabold">
                    <MapPin className="text-primary-600 h-5 w-5" aria-hidden="true" />
                    {site.shortName}
                </a>
                <nav aria-label="Sections" className="ms-4 hidden items-center gap-1 md:flex">
                    {nav.map((item) => (
                        <a key={item.href} href={item.href} className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
                            {item.label}
                        </a>
                    ))}
                </nav>
                <div className="ms-auto flex items-center gap-1">
                    <a
                        href={site.npm}
                        className={buttonVariants({ variant: 'ghost', size: 'sm' })}
                        aria-label="@bluehive/zipcodes on npm"
                    >
                        <Package className="h-4 w-4" aria-hidden="true" />
                        <span className="hidden sm:inline">npm</span>
                    </a>
                    <a
                        href={site.github}
                        className={buttonVariants({ variant: 'ghost', size: 'sm' })}
                        aria-label="bluehive-health/zipcodes on GitHub"
                    >
                        <Github className="h-4 w-4" aria-hidden="true" />
                        <span className="hidden sm:inline">GitHub</span>
                    </a>
                    <ThemeToggle variant="ghost" size="sm" />
                </div>
            </div>
        </header>
    );
}

function InstallCommand() {
    return (
        <div className="border-border bg-card flex w-full max-w-md items-center gap-3 rounded-xl border py-2 ps-4 pe-2 shadow-sm">
            <span className="text-muted-foreground font-mono select-none" aria-hidden="true">
                $
            </span>
            <code className="text-foreground flex-1 overflow-x-auto font-mono text-sm whitespace-nowrap">{site.install}</code>
            <CopyButton value={site.install} label="Copy install command" copiedLabel="Copied" />
        </div>
    );
}

function Hero() {
    return (
        <section id="top" className="border-border from-primary-50 to-background dark:from-primary-950/40 border-b bg-gradient-to-b">
            <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
                <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">Open source</Badge>
                    <Badge variant="outline">TypeScript</Badge>
                    <Badge variant="outline">Zero dependencies</Badge>
                    <Badge variant="outline">No API key</Badge>
                </div>
                <h1 className="text-foreground mt-6 max-w-3xl text-4xl font-extrabold tracking-tight text-balance sm:text-6xl">
                    {site.tagline}
                </h1>
                <p className="text-muted-foreground mt-6 max-w-2xl text-lg text-pretty sm:text-xl">{site.lede}</p>
                <div className="mt-8">
                    <InstallCommand />
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                    <a href="#playground" className={buttonVariants({ variant: 'primary', size: 'lg' })}>
                        Try it in your browser
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </a>
                    <a href="#api" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
                        <BookOpen className="h-4 w-4" aria-hidden="true" />
                        API reference
                    </a>
                </div>
                <dl className="mt-14 grid max-w-3xl grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-4">
                    {highlights.map((item) => (
                        <div key={item.label}>
                            <dt className="text-muted-foreground text-sm">{item.label}</dt>
                            <dd className="text-foreground mt-1 text-2xl font-extrabold tabular-nums">{item.value}</dd>
                        </div>
                    ))}
                </dl>
            </div>
        </section>
    );
}

function QuickStart() {
    return (
        <Section
            id="quick-start"
            title="Quick start"
            intro="Install the package, import a function, call it. Everything is synchronous."
        >
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
                <div className="min-w-0 space-y-4">
                    <h3 className="text-foreground text-lg font-bold">1. Install</h3>
                    <InstallCommand />
                    <p className="text-muted-foreground text-sm">
                        Also works with <code className="font-mono">pnpm add</code>, <code className="font-mono">yarn add</code>{' '}
                        and <code className="font-mono">bun add</code>. Requires Node.js 18 or newer.
                    </p>
                    <h3 className="text-foreground pt-2 text-lg font-bold">The record you get back</h3>
                    <CodeBlock code={zipCodeType} language="typescript" />
                </div>
                <div className="min-w-0 space-y-4">
                    <h3 className="text-foreground text-lg font-bold">2. Use</h3>
                    <Tabs defaultValue="esm" variant="pills">
                        <TabsList aria-label="Module format">
                            <TabsTrigger value="esm">ES modules</TabsTrigger>
                            <TabsTrigger value="cjs">CommonJS</TabsTrigger>
                            <TabsTrigger value="ts">TypeScript</TabsTrigger>
                        </TabsList>
                        {/* forceMount keeps every variant in the HTML for crawlers and AI agents. */}
                        <TabsContent value="esm" forceMount>
                            <CodeBlock code={quickStart.esm} language="javascript" />
                        </TabsContent>
                        <TabsContent value="cjs" forceMount>
                            <CodeBlock code={quickStart.cjs} language="javascript" />
                        </TabsContent>
                        <TabsContent value="ts" forceMount>
                            <CodeBlock code={quickStart.ts} language="typescript" />
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </Section>
    );
}

function Features() {
    return (
        <Section id="features" title="Why use it" intro="A small, boring, dependable building block for anything that touches US addresses.">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {features.map((feature) => (
                    <Card key={feature.title} as="article">
                        <CardHeader>
                            <CardTitle as="h3">{feature.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">{feature.body}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </Section>
    );
}

function ApiReference() {
    return (
        <Section
            id="api"
            title="API reference"
            intro="Every export, with its TypeScript signature and a runnable example. All functions are named exports and are also available on the default export."
        >
            <nav aria-label="API functions" className="mb-8 flex flex-wrap gap-2">
                {api.map((entry) => (
                    <a key={entry.id} href={`#api-${entry.id}`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                        <code className="font-mono">{entry.name}</code>
                    </a>
                ))}
            </nav>
            <div className="space-y-6">
                {api.map((entry) => (
                    <Card key={entry.id} as="article" id={`api-${entry.id}`}>
                        <CardHeader>
                            <div className="flex flex-wrap items-center gap-3">
                                <CardTitle as="h3">
                                    <code className="font-mono">{entry.name}</code>
                                </CardTitle>
                                {entry.since ? <Badge variant="success">New in {entry.since}</Badge> : null}
                            </div>
                            <CardDescription>{entry.summary}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <pre className="bg-muted text-foreground overflow-x-auto rounded-lg p-3 font-mono text-sm">
                                <code>{entry.signature}</code>
                            </pre>
                            {entry.details ? <p className="text-muted-foreground">{entry.details}</p> : null}
                            <CodeBlock code={entry.example} language="javascript" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </Section>
    );
}

function Faq() {
    return (
        <Section id="faq" title="Frequently asked questions">
            <div className="divide-border border-border divide-y border-y">
                {faq.map((item) => (
                    <div key={item.q} className="grid gap-2 py-6 md:grid-cols-[1fr_1.4fr] md:gap-10">
                        <h3 className="text-foreground text-lg font-bold text-balance">{item.q}</h3>
                        <p className="text-muted-foreground text-pretty">{item.a}</p>
                    </div>
                ))}
            </div>
        </Section>
    );
}

function Data() {
    return (
        <Section
            id="data"
            title="Data sources"
            intro={`${site.zipCount.toLocaleString('en-US')} ZIP codes across ${site.regionCount} states and territories. Last refreshed ${site.dataUpdated}.`}
        >
            <ul className="grid gap-4 sm:grid-cols-3">
                {dataSources.map((source) => (
                    <li key={source.href}>
                        <Card className="h-full">
                            <CardHeader>
                                <CardTitle as="h3">
                                    <a href={source.href} className="text-primary-700 dark:text-primary-300 hover:underline">
                                        {source.name}
                                    </a>
                                </CardTitle>
                                <CardDescription>{source.role}</CardDescription>
                            </CardHeader>
                        </Card>
                    </li>
                ))}
            </ul>
            <p className="text-muted-foreground mt-6 max-w-3xl">
                Coordinates are the approximate center of each ZIP code, good for distance estimates, store locators and
                "near me" search. They are not delivery-point or boundary data. Found a wrong or missing ZIP code?{' '}
                <a href={site.issues} className="text-primary-700 dark:text-primary-300 underline">
                    Open an issue
                </a>
                .
            </p>
        </Section>
    );
}

function Careers() {
    return (
        <section aria-labelledby="careers-title" className="bg-primary-700 dark:bg-primary-900">
            <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-14 sm:px-6 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 id="careers-title" className="text-2xl font-extrabold text-white sm:text-3xl">
                        Like building things like this?
                    </h2>
                    <p className="mt-2 max-w-2xl text-lg text-white/90">
                        BlueHive is part of the MIE family. We build healthcare software and share what we can as open
                        source. Come work with us.
                    </p>
                </div>
                <a
                    href={site.careers}
                    className={buttonVariants({ variant: 'secondary', size: 'lg' })}
                    target="_blank"
                    rel="noopener"
                >
                    Join our team
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>
            </div>
        </section>
    );
}

function Footer() {
    const links = [
        { href: site.github, label: 'GitHub' },
        { href: site.npm, label: 'npm' },
        { href: site.issues, label: 'Report an issue' },
        { href: '/llms.txt', label: 'llms.txt' },
        { href: site.careers, label: 'Careers' },
    ];
    return (
        <footer className="border-border border-t">
            <div className="text-muted-foreground mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 text-sm sm:px-6 md:flex-row md:items-center md:justify-between">
                <p>
                    {site.name} is open source under the {site.license} license. Maintained by{' '}
                    <a href={site.bluehive} className="text-foreground underline">
                        BlueHive Health
                    </a>
                    . Based on the original zipcodes package by Dav Glass.
                </p>
                <nav aria-label="Footer">
                    <ul className="flex flex-wrap gap-x-5 gap-y-2">
                        {links.map((link) => (
                            <li key={link.href}>
                                <a href={link.href} className="hover:text-foreground underline-offset-4 hover:underline">
                                    {link.label}
                                </a>
                            </li>
                        ))}
                    </ul>
                </nav>
            </div>
        </footer>
    );
}

export function App() {
    return (
        <ThemeProvider defaultTheme="system">
            <a
                href="#main"
                className="bg-primary-700 sr-only z-50 rounded-md px-4 py-2 text-white focus:not-sr-only focus:fixed focus:start-4 focus:top-4"
            >
                Skip to content
            </a>
            <Header />
            <main id="main">
                <Hero />
                <Section
                    id="playground"
                    title="Try it"
                    intro="This runs the real library in your browser. Nothing is sent to a server."
                >
                    <Playground />
                </Section>
                <QuickStart />
                <Features />
                <ApiReference />
                <Data />
                <Faq />
                <Careers />
            </main>
            <Footer />
        </ThemeProvider>
    );
}
