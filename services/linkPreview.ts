import { downloadImageToLocal } from './fileStorage'

export type LinkPreviewMode = 'off' | 'text' | 'text+image'

export interface LinkPreviewData {
  url: string
  title: string | null
  description: string | null
  imageUrl: string | null
  localImage: string | null
  domain: string
}

function extractDomain(url: string): string {
  try {
    const parsed = new URL(url)
    return parsed.hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function extractMetaContent(html: string, property: string): string | null {
  // Match og:property or name=property meta tags
  const ogRegex = new RegExp(
    `<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']*)["']`,
    'i'
  )
  const ogMatch = html.match(ogRegex)
  if (ogMatch?.[1]) return ogMatch[1]

  // Try reversed attribute order (content before property)
  const reversedRegex = new RegExp(
    `<meta[^>]*content=["']([^"']*)["'][^>]*property=["']${property}["']`,
    'i'
  )
  const reversedMatch = html.match(reversedRegex)
  if (reversedMatch?.[1]) return reversedMatch[1]

  // Try name attribute instead of property
  const nameRegex = new RegExp(
    `<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']*)["']`,
    'i'
  )
  const nameMatch = html.match(nameRegex)
  if (nameMatch?.[1]) return nameMatch[1]

  const nameReversedRegex = new RegExp(
    `<meta[^>]*content=["']([^"']*)["'][^>]*name=["']${property}["']`,
    'i'
  )
  const nameReversedMatch = html.match(nameReversedRegex)
  if (nameReversedMatch?.[1]) return nameReversedMatch[1]

  return null
}

function extractTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i)
  return match?.[1]?.trim() || null
}

// --- Google Maps URL handling ---

const GOOGLE_MAPS_PATTERNS = [
  /^https?:\/\/(www\.)?google\.[a-z.]+\/maps/i,
  /^https?:\/\/maps\.google\.[a-z.]+/i,
  /^https?:\/\/maps\.app\.goo\.gl\//i,
  /^https?:\/\/goo\.gl\/maps\//i,
]

function isGoogleMapsUrl(url: string): boolean {
  return GOOGLE_MAPS_PATTERNS.some(pattern => pattern.test(url))
}

interface MapsLocationData {
  lat: number
  lng: number
  placeName: string | null
}

async function resolveGoogleMapsUrl(url: string): Promise<string> {
  // Short links need redirect resolution to get the full URL with coordinates
  if (/goo\.gl/i.test(url)) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)
      const response = await fetch(url, {
        signal: controller.signal,
        redirect: 'follow',
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LaterBox/1.0)' },
      })
      clearTimeout(timeout)
      return response.url
    } catch {
      return url
    }
  }
  return url
}

function extractLocationFromMapsUrl(url: string): MapsLocationData | null {
  try {
    // Pattern 1: /place/Place+Name/@lat,lng,zoom
    const placeMatch = url.match(/\/place\/([^/@]+)\/@(-?\d+\.?\d*),(-?\d+\.?\d*)/)
    if (placeMatch) {
      return {
        lat: parseFloat(placeMatch[2]),
        lng: parseFloat(placeMatch[3]),
        placeName: decodeURIComponent(placeMatch[1].replace(/\+/g, ' ')),
      }
    }

    // Pattern 2: /search/query/@lat,lng
    const searchMatch = url.match(/\/search\/([^/@]+)\/@(-?\d+\.?\d*),(-?\d+\.?\d*)/)
    if (searchMatch) {
      return {
        lat: parseFloat(searchMatch[2]),
        lng: parseFloat(searchMatch[3]),
        placeName: decodeURIComponent(searchMatch[1].replace(/\+/g, ' ')),
      }
    }

    // Pattern 3: /@lat,lng,zoom (bare coordinates)
    const coordMatch = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*),(\d+\.?\d*)z/)
    if (coordMatch) {
      return {
        lat: parseFloat(coordMatch[1]),
        lng: parseFloat(coordMatch[2]),
        placeName: null,
      }
    }

    // Pattern 4: ?q=lat,lng or ?q=query
    const parsed = new URL(url)
    const q = parsed.searchParams.get('q')
    if (q) {
      const qCoordMatch = q.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/)
      if (qCoordMatch) {
        return {
          lat: parseFloat(qCoordMatch[1]),
          lng: parseFloat(qCoordMatch[2]),
          placeName: null,
        }
      }
      return { lat: 0, lng: 0, placeName: q }
    }

    // Pattern 5: ?ll=lat,lng
    const ll = parsed.searchParams.get('ll')
    if (ll) {
      const llMatch = ll.match(/^(-?\d+\.?\d*),(-?\d+\.?\d*)$/)
      if (llMatch) {
        return {
          lat: parseFloat(llMatch[1]),
          lng: parseFloat(llMatch[2]),
          placeName: null,
        }
      }
    }

    return null
  } catch {
    return null
  }
}

function latLngToTile(lat: number, lng: number, zoom: number): { x: number; y: number } {
  const x = Math.floor((lng + 180) / 360 * Math.pow(2, zoom))
  const latRad = lat * Math.PI / 180
  const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * Math.pow(2, zoom))
  return { x, y }
}

async function fetchGoogleMapsPreview(
  url: string,
  mode: LinkPreviewMode
): Promise<LinkPreviewData | null> {
  try {
    const resolvedUrl = await resolveGoogleMapsUrl(url)
    const location = extractLocationFromMapsUrl(resolvedUrl)
    if (!location) return null

    const hasCoords = location.lat !== 0 && location.lng !== 0
    let localImage: string | null = null

    if (mode === 'text+image' && hasCoords) {
      const zoom = 15
      const tile = latLngToTile(location.lat, location.lng, zoom)
      const tileUrl = `https://tile.openstreetmap.org/${zoom}/${tile.x}/${tile.y}.png`
      localImage = await downloadImageToLocal(tileUrl, 'map')
    }

    return {
      url,
      title: location.placeName || 'Google Maps Location',
      description: hasCoords ? `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}` : null,
      imageUrl: null,
      localImage,
      domain: 'maps.google.com',
    }
  } catch {
    return null
  }
}

// --- Main fetch function ---

export async function fetchLinkPreview(
  url: string,
  mode: LinkPreviewMode = 'text+image'
): Promise<LinkPreviewData> {
  const domain = extractDomain(url)
  const fallback: LinkPreviewData = {
    url,
    title: null,
    description: null,
    imageUrl: null,
    localImage: null,
    domain,
  }

  // Google Maps: specialized handling
  if (isGoogleMapsUrl(url)) {
    const mapsPreview = await fetchGoogleMapsPreview(url, mode)
    if (mapsPreview) return mapsPreview
    // Fall through to generic OG scraper if extraction failed
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LaterBox/1.0)',
      },
    })
    clearTimeout(timeout)

    if (!response.ok) return fallback

    const html = await response.text()

    const ogTitle = extractMetaContent(html, 'og:title')
    const ogDescription = extractMetaContent(html, 'og:description')
    const ogImage = extractMetaContent(html, 'og:image')

    const title = ogTitle || extractMetaContent(html, 'twitter:title') || extractTitle(html)
    const description = ogDescription || extractMetaContent(html, 'twitter:description') || extractMetaContent(html, 'description')

    let imageUrl = ogImage || extractMetaContent(html, 'twitter:image')
    let localImage: string | null = null

    // Resolve relative image URLs
    if (imageUrl && !imageUrl.startsWith('http')) {
      try {
        imageUrl = new URL(imageUrl, url).toString()
      } catch {
        imageUrl = null
      }
    }

    // Download OG image locally if mode is text+image
    if (mode === 'text+image' && imageUrl) {
      localImage = await downloadImageToLocal(imageUrl, 'og_preview')
    }

    return {
      url,
      title: title ? decodeHTMLEntities(title) : null,
      description: description ? decodeHTMLEntities(description) : null,
      imageUrl: imageUrl || null,
      localImage,
      domain,
    }
  } catch {
    return fallback
  }
}

function decodeHTMLEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
}

/** Detect if a string contains a URL */
export function extractFirstUrl(text: string): string | null {
  const urlRegex = /https?:\/\/[^\s<>"\])}]+/i
  const match = text.match(urlRegex)
  return match?.[0] || null
}
