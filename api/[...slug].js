export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { slug } = req.query;
  const path = Array.isArray(slug) ? slug.join('/') : slug;
  
  // Remove slug from query params to avoid duplication
  const queryParams = { ...req.query };
  delete queryParams.slug;
  
  const queryString = new URLSearchParams(queryParams).toString();
  const tmdbUrl = `https://api.themoviedb.org/3/${path}${queryString ? '?' + queryString : ''}`;
  
  try {
    // Try multiple proxy approaches for better reliability
    const proxyUrls = [
      `https://cors-anywhere.herokuapp.com/${tmdbUrl}`,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(tmdbUrl)}`,
      tmdbUrl // Direct access as fallback
    ];

    let response;
    let lastError;

    for (const proxyUrl of proxyUrls) {
      try {
        console.log(`Trying: ${proxyUrl}`);
        
        if (proxyUrl.includes('allorigins.win')) {
          // Special handling for allorigins proxy
          response = await fetch(proxyUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
          });
        } else {
          response = await fetch(proxyUrl, {
            method: req.method,
            headers: {
              'Accept': 'application/json',
              'Authorization': `Bearer ${process.env.VITE_AUTH_KEY}`,
              'Content-Type': 'application/json',
            },
          });
        }

        if (response.ok) {
          console.log(`Success with: ${proxyUrl}`);
          break;
        }
      } catch (error) {
        console.log(`Failed with ${proxyUrl}:`, error.message);
        lastError = error;
        continue;
      }
    }

    if (!response || !response.ok) {
      throw lastError || new Error('All proxy attempts failed');
    }

    const data = await response.json();
    
    res.status(response.status).json(data);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'API request failed', 
      message: 'Unable to access TMDB API. This might be due to regional restrictions.',
      details: error.message 
    });
  }
}
