import { Alert, AlertDescription } from '@mieweb/ui/components/Alert';
import { Badge } from '@mieweb/ui/components/Badge';
import { Card, CardContent } from '@mieweb/ui/components/Card';
import { Input } from '@mieweb/ui/components/Input';
import { Skeleton } from '@mieweb/ui/components/Skeleton';
import { Slider } from '@mieweb/ui/components/Slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@mieweb/ui/components/Tabs';
import { useEffect, useState, type ReactNode } from 'react';
import type { ZipCode } from '@bluehive/zipcodes';

type Zipcodes = typeof import('@bluehive/zipcodes');

/** Loads the library (and its dataset) after the page is interactive. */
function useZipcodes(): Zipcodes | null {
    const [lib, setLib] = useState<Zipcodes | null>(null);
    useEffect(() => {
        let cancelled = false;
        void import('@bluehive/zipcodes').then((mod) => {
            if (!cancelled) {
                setLib(mod);
            }
        });
        return () => {
            cancelled = true;
        };
    }, []);
    return lib;
}

function Call({ children }: { children: string }) {
    return (
        <pre className="bg-muted text-foreground overflow-x-auto rounded-lg p-3 font-mono text-sm">
            <code>{children}</code>
        </pre>
    );
}

function Result({ children }: { children: ReactNode }) {
    return (
        <div aria-live="polite" className="min-h-24">
            {children}
        </div>
    );
}

function Record({ record, extra }: { record: ZipCode; extra?: string }) {
    return (
        <div className="border-border flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b py-2 last:border-b-0">
            <code className="text-primary-700 dark:text-primary-300 font-mono font-bold">{record.zip}</code>
            <span className="text-foreground font-semibold">
                {record.city}, {record.state}
            </span>
            <span className="text-muted-foreground text-sm tabular-nums">
                {record.latitude}, {record.longitude}
            </span>
            {extra ? <span className="text-muted-foreground ms-auto text-sm tabular-nums">{extra}</span> : null}
        </div>
    );
}

function NotFound({ children }: { children: ReactNode }) {
    return (
        <Alert variant="warning">
            <AlertDescription>{children}</AlertDescription>
        </Alert>
    );
}

/** Formats user input as a JavaScript string literal for the "code being run" display. */
const quote = (value: string) => `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

function LookupDemo({ lib }: { lib: Zipcodes }) {
    const [zip, setZip] = useState('90210');
    const record = lib.lookup(zip);
    return (
        <div className="space-y-4">
            <Input
                label="ZIP code"
                value={zip}
                onChange={(event) => setZip(event.target.value)}
                inputMode="numeric"
                maxLength={10}
                helperText="Try 00801, 96910 or a ZIP+4 like 10001-2345."
            />
            <Call>{`lookup(${quote(zip)})`}</Call>
            <Result>
                {record ? <Record record={record} /> : <NotFound>No ZIP code matches. lookup() returns undefined.</NotFound>}
            </Result>
        </div>
    );
}

function DistanceDemo({ lib }: { lib: Zipcodes }) {
    const [from, setFrom] = useState('10001');
    const [to, setTo] = useState('90210');
    const miles = lib.distance(from, to);
    const a = lib.lookup(from);
    const b = lib.lookup(to);
    return (
        <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
                <Input label="From ZIP code" value={from} onChange={(event) => setFrom(event.target.value)} inputMode="numeric" maxLength={10} />
                <Input label="To ZIP code" value={to} onChange={(event) => setTo(event.target.value)} inputMode="numeric" maxLength={10} />
            </div>
            <Call>{`distance(${quote(from)}, ${quote(to)})`}</Call>
            <Result>
                {miles !== null && a && b ? (
                    <p className="text-foreground text-lg">
                        <strong className="text-3xl font-extrabold tabular-nums">{miles.toLocaleString('en-US')}</strong> miles (
                        {lib.toKilometers(miles).toLocaleString('en-US')} km) in a straight line from {a.city}, {a.state} to{' '}
                        {b.city}, {b.state}.
                    </p>
                ) : (
                    <NotFound>One of those ZIP codes doesn't exist. distance() returns null.</NotFound>
                )}
            </Result>
        </div>
    );
}

const PREVIEW = 8;

function RadiusDemo({ lib }: { lib: Zipcodes }) {
    const [zip, setZip] = useState('95014');
    const [miles, setMiles] = useState(25);
    const center = lib.lookup(zip);
    const matches = lib.radius(zip, miles, true);
    return (
        <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Center ZIP code" value={zip} onChange={(event) => setZip(event.target.value)} inputMode="numeric" maxLength={10} />
                <Slider
                    label="Radius"
                    value={miles}
                    onValueChange={setMiles}
                    min={1}
                    max={100}
                    showValue
                    formatValue={(value) => `${value} mi`}
                />
            </div>
            <Call>{`radius(${quote(zip)}, ${miles}, true)`}</Call>
            <Result>
                {center ? (
                    <>
                        <p className="text-foreground mb-2">
                            <strong className="tabular-nums">{matches.length.toLocaleString('en-US')}</strong> ZIP codes within{' '}
                            {miles} miles of {center.city}, {center.state}
                            {matches.length > PREVIEW ? `. Showing the first ${PREVIEW}.` : '.'}
                        </p>
                        {matches.slice(0, PREVIEW).map((record) => (
                            <Record key={record.zip} record={record} extra={`${lib.distance(zip, record.zip)} mi`} />
                        ))}
                    </>
                ) : (
                    <NotFound>Unknown center ZIP code. radius() returns an empty array.</NotFound>
                )}
            </Result>
        </div>
    );
}

function SearchDemo({ lib }: { lib: Zipcodes }) {
    const [query, setQuery] = useState('san f');
    const matches = lib.search(query, { limit: 8 });
    return (
        <div className="space-y-4">
            <Input
                label="City name starts with"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                autoComplete="off"
                helperText="Prefix search across every city, for autocomplete inputs."
            />
            <Call>{`search(${quote(query)}, { limit: 8 })`}</Call>
            <Result>
                {matches.length > 0 ? (
                    matches.map((match) => (
                        <div
                            key={`${match.city}|${match.state}`}
                            className="border-border flex flex-wrap items-center gap-x-3 gap-y-1 border-b py-2 last:border-b-0"
                        >
                            <span className="text-foreground font-semibold">
                                {match.city}, {match.state}
                            </span>
                            <Badge variant="outline">
                                {match.zips.length} ZIP {match.zips.length === 1 ? 'code' : 'codes'}
                            </Badge>
                            <code className="text-muted-foreground font-mono text-sm">
                                {match.zips.slice(0, 4).join(', ')}
                                {match.zips.length > 4 ? ', …' : ''}
                            </code>
                        </div>
                    ))
                ) : (
                    <NotFound>No city starts with that. search() returns an empty array.</NotFound>
                )}
            </Result>
        </div>
    );
}

function CoordsDemo({ lib }: { lib: Zipcodes }) {
    const [latitude, setLatitude] = useState('40.7128');
    const [longitude, setLongitude] = useState('-74.0060');
    const lat = Number(latitude);
    const lon = Number(longitude);
    const valid = latitude.trim() !== '' && longitude.trim() !== '' && Number.isFinite(lat) && Number.isFinite(lon);
    const matches = valid ? lib.nearest(lat, lon, 5) : [];
    return (
        <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Latitude" value={latitude} onChange={(event) => setLatitude(event.target.value)} inputMode="decimal" />
                <Input label="Longitude" value={longitude} onChange={(event) => setLongitude(event.target.value)} inputMode="decimal" />
            </div>
            <Call>{`nearest(${valid ? lat : 'NaN'}, ${valid ? lon : 'NaN'}, 5)`}</Call>
            <Result>
                {matches.length > 0 ? (
                    matches.map((match) => (
                        <Record key={match.code.zip} record={match.code} extra={`${match.miles.toFixed(2)} mi`} />
                    ))
                ) : (
                    <NotFound>Enter a latitude and a longitude as decimal degrees.</NotFound>
                )}
            </Result>
        </div>
    );
}

const demos = [
    { value: 'lookup', label: 'Lookup', Demo: LookupDemo },
    { value: 'distance', label: 'Distance', Demo: DistanceDemo },
    { value: 'radius', label: 'Radius', Demo: RadiusDemo },
    { value: 'search', label: 'City search', Demo: SearchDemo },
    { value: 'coords', label: 'Coordinates', Demo: CoordsDemo },
] as const;

export function Playground() {
    const lib = useZipcodes();
    return (
        <Card>
            <CardContent>
                <Tabs defaultValue="lookup">
                    <TabsList aria-label="Function to try">
                        {demos.map((demo) => (
                            <TabsTrigger key={demo.value} value={demo.value}>
                                {demo.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                    {demos.map(({ value, Demo }) => (
                        <TabsContent key={value} value={value} className="pt-6">
                            {lib ? (
                                <Demo lib={lib} />
                            ) : (
                                <div className="space-y-4" role="status" aria-label="Loading the ZIP code dataset">
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-11 w-full" />
                                    <Skeleton className="h-24 w-full" />
                                </div>
                            )}
                        </TabsContent>
                    ))}
                </Tabs>
            </CardContent>
        </Card>
    );
}
