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
  const updateResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/property_content?property_slug=eq.${PROPERTY_SLUG}&content_key=eq.${key}`,
    {
      method: 'PATCH',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify({
        content_value: value
      })
    }
  );

  if (!updateResponse.ok) {
    const text = await updateResponse.text();
    throw new Error(`Supabase update failed for ${key}: ${text}`);
  }

  const checkResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/property_content?property_slug=eq.${PROPERTY_SLUG}&content_key=eq.${key}&select=content_key`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    }
  );

  const existingRows = await checkResponse.json();

  if (existingRows.length > 0) {
    return;
  }

  const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/property_content`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal'
    },
    body: JSON.stringify({
      property_slug: PROPERTY_SLUG,
      content_key: key,
      content_value: value
    })
  });

  if (!insertResponse.ok) {
    const text = await insertResponse.text();
    throw new Error(`Supabase insert failed for ${key}: ${text}`);
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

       const featuredStart = html.indexOf('Featured Events');
    const featuredHtml = featuredStart >= 0 ? html.slice(featuredStart) : html;

   const eventCards = [...featuredHtml.matchAll(
  /<a[^>]*href="([^"]*\/events\/[^"]+)"[^>]*>[\s\S]*?<h3[^>]*>(.*?)<\/h3>[\s\S]*?<p[^>]*class="[^"]*date[^"]*"[^>]*>(.*?)<\/p>/gi
)];

const firstEvent = eventCards[0];

const eventPath = firstEvent?.[1] || '/events/';
const title = cleanText(firstEvent?.[2] || 'Upcoming Blue Ridge Event');
const dates = cleanText(firstEvent?.[3] || '');
const location = 'Blue Ridge, Georgia';

    const dates = cleanText(firstEventMatch?.[1] || '');
    const eventPath = firstEventMatch?.[2] || '/events/';
    const title = cleanText(firstEventMatch?.[3] || 'Upcoming Blue Ridge Event');
    const location = cleanText(firstEventMatch?.[4] || 'Blue Ridge, Georgia');

    const eventLink = eventPath.startsWith('http')
      ? eventPath
      : `https://www.blueridgemountains.com${eventPath}`;

    const description = `Upcoming event in Blue Ridge: ${title}.`;

    await saveContent('next_event_show', 'yes');
    await saveContent('next_event_title', title);
    await saveContent('next_event_dates', dates);
 await saveContent('next_event_location', location);
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
