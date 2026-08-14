import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, LayersControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Globe, Star, X, MapPin, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

/** Leaflet measures the container on creation; inside flex/grid layouts that
 *  measurement is often stale, which leaves the interactive GeoJSON pane
 *  offset from the tiles so clicks never hit a country. */
function ResizeFix() {
  const map = useMap();
  useEffect(() => {
    const invalidate = () => map.invalidateSize();
    const t1 = setTimeout(invalidate, 0);
    const t2 = setTimeout(invalidate, 300);
    const container = map.getContainer();
    const ro = new ResizeObserver(invalidate);
    ro.observe(container);
    window.addEventListener('resize', invalidate);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      ro.disconnect();
      window.removeEventListener('resize', invalidate);
    };
  }, [map]);
  return null;
}


// Fix default Leaflet marker icons (Vite asset issue)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface NewsItem {
  headline: string;
  summary: string;
  category: string;
  importance: 'high' | 'medium';
}

interface CountryData {
  country: string;
  capital?: string;
  summary?: string;
  indiaRelation?: string;
  news: NewsItem[];
  date?: string;
}

const categoryColors: Record<string, string> = {
  Polity: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Economy: 'bg-green-500/20 text-green-400 border-green-500/30',
  IR: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  Conflict: 'bg-red-500/20 text-red-400 border-red-500/30',
  Science: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  Environment: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};

const GEOJSON_URL =
  'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson';

function getCountryName(props: any): string {
  return props?.NAME || props?.ADMIN || props?.name || 'Unknown';
}
function getCountryCode(props: any): string | undefined {
  return props?.ISO_A2 || props?.iso_a2 || undefined;
}

export default function WorldMap() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CountryData | null>(null);
  const [geo, setGeo] = useState<any>(null);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [selectedCode, setSelectedCode] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const geoLayerRef = useRef<L.GeoJSON | null>(null);
  const inFlight = useRef<Set<string>>(new Set());
  const activeRequest = useRef(0);
  const FETCH_TIMEOUT_MS = 15000;

  useEffect(() => {
    fetch(GEOJSON_URL)
      .then((r) => r.json())
      .then(setGeo)
      .catch((e) => console.error('GeoJSON load failed', e));
  }, []);

  const fetchCountry = async (name: string, code?: string) => {
    setSelectedName(name);
    setSelectedCode(code);
    setData(null);
    setError(null);

    const todayIso = new Date().toISOString().slice(0, 10);
    const cacheKey = `country-news:${name.toLowerCase()}:${todayIso}`;

    // Session cache — instant re-open of a country already viewed today
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        setData(JSON.parse(cached));
        return;
      } catch {
        sessionStorage.removeItem(cacheKey);
      }
    }

    // Avoid duplicate in-flight requests for the same country
    if (inFlight.current.has(cacheKey)) return;
    inFlight.current.add(cacheKey);

    const reqId = ++activeRequest.current;
    setLoading(true);

    // UI timeout: if the function hasn't responded in time, show a retry button.
    // The underlying request may still complete, but a stale guard prevents it
    // from overwriting a newer request or the error state.
    const timeoutId = setTimeout(() => {
      if (activeRequest.current !== reqId) return;
      inFlight.current.delete(cacheKey);
      setLoading(false);
      setError('The request is taking too long. Click Retry to try again.');
    }, FETCH_TIMEOUT_MS);

    try {
      const { data: news, error: invokeError } = await supabase.functions.invoke('fetch-country-news', {
        body: { country: name, countryCode: code },
      });
      clearTimeout(timeoutId);
      if (activeRequest.current !== reqId) return;
      if (invokeError) throw invokeError;
      setData(news);
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify(news));
      } catch {
        /* storage full — non-fatal */
      }
    } catch (e: any) {
      clearTimeout(timeoutId);
      if (activeRequest.current !== reqId) return;
      console.error(e);
      const msg = String(e?.message || '');
      const description = msg.includes('429')
        ? 'Too many requests — wait a moment before loading another country.'
        : 'Failed to load country news.';
      setError(description);
      toast({
        title: msg.includes('429') ? 'Slow down' : 'Error',
        description,
        variant: 'destructive',
      });
    } finally {
      if (activeRequest.current === reqId) {
        inFlight.current.delete(cacheKey);
        setLoading(false);
      }
    }
  };

  const baseStyle = {
    fillColor: 'hsl(var(--primary))',
    fillOpacity: 0.05,
    color: 'hsl(var(--primary))',
    weight: 0.6,
    opacity: 0.5,
  } as L.PathOptions;
  const hoverStyle = { fillOpacity: 0.35, weight: 1.5, opacity: 1 } as L.PathOptions;
  const selectedStyle = {
    fillColor: 'hsl(var(--primary))',
    fillOpacity: 0.55,
    color: 'hsl(var(--primary))',
    weight: 2,
    opacity: 1,
  } as L.PathOptions;

  const onEachFeature = (feature: any, layer: L.Layer) => {
    const name = getCountryName(feature.properties);
    const code = getCountryCode(feature.properties);
    layer.bindTooltip(name, { sticky: true, direction: 'top', className: 'country-tooltip' });
    layer.on({
      mouseover: (e) => {
        if (selectedName !== name) (e.target as L.Path).setStyle(hoverStyle);
      },
      mouseout: (e) => {
        if (selectedName !== name) (e.target as L.Path).setStyle(baseStyle);
      },
      click: () => fetchCountry(name, code),
    });
  };

  // Re-style when selection changes
  useEffect(() => {
    if (!geoLayerRef.current) return;
    geoLayerRef.current.eachLayer((layer: any) => {
      const name = getCountryName(layer.feature?.properties);
      layer.setStyle(name === selectedName ? selectedStyle : baseStyle);
    });
  }, [selectedName]);

  return (
    <AppLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Globe className="h-8 w-8 text-primary" />
            World News Map
          </h1>
          <p className="text-muted-foreground mt-1">
            Hover a country to see its name, click to load today's UPSC-relevant news. Switch between Standard, Satellite, Terrain, and Dark views.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_400px]">
          <Card className="overflow-hidden">
            <div className="h-[600px] w-full relative">
              <MapContainer
                center={[20, 0]}
                zoom={2}
                minZoom={2}
                worldCopyJump
                style={{ height: '100%', width: '100%' }}
              >
                <ResizeFix />
                <LayersControl position="topright">

                  <LayersControl.BaseLayer checked name="Standard">
                    <TileLayer
                      attribution='&copy; OpenStreetMap'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                  </LayersControl.BaseLayer>
                  <LayersControl.BaseLayer name="Satellite">
                    <TileLayer
                      attribution='Tiles &copy; Esri'
                      url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    />
                  </LayersControl.BaseLayer>
                  <LayersControl.BaseLayer name="Terrain">
                    <TileLayer
                      attribution='&copy; OpenTopoMap'
                      url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
                    />
                  </LayersControl.BaseLayer>
                  <LayersControl.BaseLayer name="Dark">
                    <TileLayer
                      attribution='&copy; CARTO'
                      url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    />
                  </LayersControl.BaseLayer>
                </LayersControl>
                {geo && (
                  <GeoJSON
                    data={geo}
                    style={baseStyle as any}
                    onEachFeature={onEachFeature}
                    ref={(r: any) => {
                      geoLayerRef.current = r || null;
                    }}
                  />
                )}
              </MapContainer>
            </div>
          </Card>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {!selectedName && !loading && (
              <Card className="border-dashed">
                <CardContent className="p-6 text-center text-muted-foreground">
                  <MapPin className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Click anywhere on the map to load that country's latest news.</p>
                </CardContent>
              </Card>
            )}

            {loading && (
              <>
                <Card><CardHeader><Skeleton className="h-6 w-2/3" /><Skeleton className="h-4 w-1/3 mt-2" /></CardHeader>
                  <CardContent><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6 mt-2" /></CardContent></Card>
                {[...Array(3)].map((_, i) => (
                  <Card key={i}><CardHeader><Skeleton className="h-5 w-3/4" /></CardHeader>
                    <CardContent><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-2/3 mt-2" /></CardContent></Card>
                ))}
              </>
            )}

            {data && !loading && (
              <>
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl">{data.country}</CardTitle>
                        {data.capital && (
                          <p className="text-xs text-muted-foreground mt-1">Capital: {data.capital}</p>
                        )}
                        {data.date && (
                          <p className="text-xs text-muted-foreground">{data.date}</p>
                        )}
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => { setData(null); setSelectedName(null); }}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {data.summary && <p className="text-sm">{data.summary}</p>}
                    {data.indiaRelation && (
                      <div className="rounded-md bg-primary/10 border border-primary/20 p-2">
                        <p className="text-xs font-semibold text-primary mb-1">🇮🇳 India Relations</p>
                        <p className="text-xs">{data.indiaRelation}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {data.news?.map((n, i) => (
                  <Card key={i} className="overflow-hidden">
                    <div className={`h-1 ${n.importance === 'high' ? 'bg-yellow-500' : 'bg-muted-foreground/30'}`} />
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm leading-snug">
                        {n.importance === 'high' && <Star className="inline h-3 w-3 text-yellow-500 mr-1" />}
                        {n.headline}
                      </CardTitle>
                      <Badge variant="outline" className={`${categoryColors[n.category] || ''} w-fit text-xs`}>
                        {n.category}
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground leading-relaxed">{n.summary}</p>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
