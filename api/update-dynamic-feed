const SUPABASE_URL = 'https://mulzvuvbpzoylkciqgse.supabase.co';
const SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11bHp2dXZicHpveWxrY2lxZ3NlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNjUzNzAsImV4cCI6MjA5MDY0MTM3MH0.IMth3h_-vkQg4OYE0KWFNiAVRdPALVzk9R43kq-KW3I';

const PROPERTY_CONFIG = {
  'summit-social-club': {
    feedType: 'events',
    sourceName: 'Gatlinburg Convention and Visitors Bureau',
    sourceUrl: 'https://www.gatlinburg.com/events/',
    defaultLocation: 'Gatlinburg, Tennessee'
  }

  /*
    We will add Darby's Ridge here after Summit is tested:

    'darbys-ridge': {
      feedType: 'events',
      sourceName: 'Georgia’s Blue Ridge',
      sourceUrl: 'https://www.blueridgemountains.com/events/',
      defaultLocation: 'Blue Ridge, Georgia'
    }
  */
};

function cleanText(value = '') {
  return String(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&#8217;/gi, '’')
    .replace(/&#8211;/gi, '–')
    .replace(/&#8212;/gi, '—')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function absoluteUrl(value, baseUrl) {
  try {
    return new URL(value, baseUrl).href;
  } catch {
    return '';
  }
}

function normalizeDate(value) {
  if (!value) return null;

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

function flattenJsonLd(value) {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.flatMap(flattenJsonLd);
  }

  if (typeof value !== 'object') {
    return [];
  }

  if (Array.isArray(value['@graph'])) {
    return value['@graph'].flatMap(flattenJsonLd);
  }

  return [value];
}

function isEventObject(item) {
  const type = item?.['@type'];

  if (Array.isArray(type)) {
    return type.some(value =>
      String(value).toLowerCase().includes('event')
    );
  }

  return String(type || '')
    .toLowerCase()
    .includes('event');
}

function extractJsonLdEvents(html, config) {
  const scripts = [
    ...html.matchAll(
      /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    )
  ];

  const events = [];

  for (const script of scripts) {
    try {
      const parsed = JSON.parse(script[1]);
      const objects = flattenJsonLd(parsed);

      for (const item of objects) {
        if (!isEventObject(item)) continue;

        const title = cleanText(item.name || '');
        const startDate = normalizeDate(item.startDate);
        const endDate = normalizeDate(item.endDate);

        const locationName = cleanText(
          item.location?.name ||
          item.location?.address?.addressLocality ||
          config.defaultLocation
        );

        const description = cleanText(item.description || '');

        const link = absoluteUrl(
          item.url || item.mainEntityOfPage || '',
          config.sourceUrl
        );

        if (!title || !startDate) continue;

        events.push({
          title,
          startDate,
          endDate,
          location: locationName || config.defaultLocation,
          description,
          link,
          source: config.sourceName
        });
      }
    } catch (error) {
      console.warn('Could not parse one JSON-LD block:', error.message);
    }
  }

  return events;
}

function uniqueFutureEvents(events) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const seen = new Set();

  return events
    .filter(event => {
      const date = new Date(event.startDate);

      return (
        !Number.isNaN(date.getTime()) &&
        date >= now &&
        event.title
      );
    })
    .sort(
      (a, b) =>
        new Date(a.startDate).getTime() -
        new Date(b.startDate).getTime()
    )
    .filter(event => {
      const key = `${event.title.toLowerCase()}|${event.startDate}`;

      if (seen.has(key)) return false;

      seen.add(key);
      return true;
    })
    .slice(0, 5);
}

async function saveContent(propertySlug, contentKey, contentValue) {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/property_content` +
      `?on_conflict=property_slug,content_key`,
    {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal'
      },
      body: JSON.stringify({
        property_slug: propertySlug,
        content_key: contentKey,
        content_value: contentValue
      })
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase save failed: ${text}`);
  }
}

module.exports = async function handler(req, res) {
  try {
    const propertySlug = String(
      req.query.property || 'summit-social-club'
    ).trim();

    const config = PROPERTY_CONFIG[propertySlug];

    if (!config) {
      return res.status(400).json({
        success: false,
        error: `No dynamic-feed configuration exists for ${propertySlug}.`
      });
    }

    const pageResponse = await fetch(config.sourceUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 DRBHostsGuestGuide/1.0',
        Accept: 'text/html,application/xhtml+xml'
      }
    });

    if (!pageResponse.ok) {
      throw new Error(
        `Event source returned ${pageResponse.status}.`
      );
    }

    const html = await pageResponse.text();

    const extractedEvents = extractJsonLdEvents(html, config);
    const upcomingEvents = uniqueFutureEvents(extractedEvents);

    await saveContent(
      propertySlug,
      'upcoming_events',
      JSON.stringify(upcomingEvents)
    );

    await saveContent(
      propertySlug,
      'upcoming_events_source',
      config.sourceName
    );

    await saveContent(
      propertySlug,
      'upcoming_events_updated_at',
      new Date().toISOString()
    );

    return res.status(200).json({
      success: true,
      property: propertySlug,
      source: config.sourceName,
      count: upcomingEvents.length,
      events: upcomingEvents
    });
  } catch (error) {
    console.error('Dynamic-feed error:', error);

    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
