export default function handler(req, res) {
  const host = String(req.headers.host || '')
    .toLowerCase()
    .split(':')[0];

  const properties = {
    'darbysridgeapp.drbhosts.com': {
      title: "Darby's Ridge Guest App",
      description: "Your mountain stay guide for Darby's Ridge in Blue Ridge, Georgia.",
     image: 'https://darbysridgeapp.drbhosts.com/darbysridge-icon-512.png',
      url: 'https://darbysridgeapp.drbhosts.com'
    },

    'oceanpearlapp.drbhosts.com': {
      title: 'The Ocean Pearl Guest App',
      description: 'Your coastal stay guide for The Ocean Pearl.',
      image: 'https://oceanpearlapp.drbhosts.com/op-icon-512.png',
      url: 'https://oceanpearlapp.drbhosts.com'
    },

    'summitsocialclubapp.drbhosts.com': {
      title: 'Summit Social Club Guest App',
      description: 'Your private guest guide for Summit Social Club in the Smoky Mountains.',
      image: 'https://summitsocialclubapp.drbhosts.com/summit-icon-512.png',
      url: 'https://summitsocialclubapp.drbhosts.com'
    }
  };

  const property = properties[host];

  if (!property) {
    return res.status(404).send('Property not found');
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300');

  return res.status(200).send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">

  <title>${property.title}</title>

  <meta property="og:title" content="${property.title}">
  <meta property="og:description" content="${property.description}">
  <meta property="og:image" content="${property.image}">
  <meta property="og:url" content="${property.url}">
  <meta property="og:type" content="website">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${property.title}">
  <meta name="twitter:description" content="${property.description}">
  <meta name="twitter:image" content="${property.image}">

  <link rel="icon" href="${property.image}">
  <link rel="apple-touch-icon" href="${property.image}">
</head>

<body>
  <h1>${property.title}</h1>
  <p>${property.description}</p>
  <a href="${property.url}">Open Guest App</a>
</body>
</html>`);
}
