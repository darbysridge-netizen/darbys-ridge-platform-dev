const SUPABASE_URL = 'https://mulzvuvbpzoylkciqgse.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11bHp2dXZicHpveWxrY2lxZ3NlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNjUzNzAsImV4cCI6MjA5MDY0MTM3MH0.IMth3h_-vkQg4OYE0KWFNiAVRdPALVzk9R43kq-KW3I';

const PROPERTY_SLUG = 'darbys-ridge';
const EVENTS_URL = 'https://www.blueridgemountains.com/events/';

function cleanText(value = '') {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#8217;/g, '’')
    .replace(/&#8211;/g, '–')
    .replace(/\s+/g, ' ')
    .trim();
}

async function saveContent(key, value) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/property_content`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal'
    },
    body: JSON.stringify({
      property_slug: PROPERTY_SLUG,
      content_key: key,
      content_value: value
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase save failed for ${key}: ${text}`);
  }
}

module.exports = async function handler(req, res) {
  try {
    const page = await fetch(EVENTS_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 DarbysRidgeGuestGuide/1.0'
      }
    });

    const html = await page.text();

    const firstEventLinkMatch = html.match(/href="([^"]*\/events\/annual-events\/[^"]+)"/i);
    const eventPath = firstEventLinkMatch ? firstEventLinkMatch[1] : '/events/';
    const eventLink = eventPath.startsWith('http')
      ? eventPath
      : `https://www.blueridgemountains.com${eventPath}`;

    const eventPage = await fetch(eventLink, {
      headers: {
        'User-Agent': 'Mozilla/5.0 DarbysRidgeGuestGuide/1.0'
      }
    });

    const eventHtml = await eventPage.text();

    const titleMatch = eventHtml.match(/<h1[^>]*>(.*?)<\/h1>/i);
    const title = cleanText(titleMatch?.[1] || 'Upcoming Blue Ridge Event');

    const descriptionMatch = eventHtml.match(/<p[^>]*>(.*?)<\/p>/i);
    const description = cleanText(
      descriptionMatch?.[1] ||
      'See what’s happening during your stay in Blue Ridge.'
    );

    const datesMatch =
      html.match(/([A-Z][a-z]+\.?\s+\d{1,2}\s+—\s+[A-Z][a-z]+\.?\s+\d{1,2}|[A-Z][a-z]+\.?\s+\d{1,2}\s+—\s+\d{1,2})/);

    const dates = cleanText(datesMatch?.[1] || '');

    await saveContent('next_event_show', 'yes');
    await saveContent('next_event_title', title);
    await saveContent('next_event_dates', dates);
    await saveContent('next_event_location', 'Blue Ridge, Georgia');
    await saveContent('next_event_description', description);
    await saveContent('next_event_link', eventLink);

    res.status(200).json({
      success: true,
      title,
      dates,
      location: 'Blue Ridge, Georgia',
      description,
      link: eventLink
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
