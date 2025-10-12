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
    // Try multiple proxy services with different DNS resolution
    const proxyServices = [
      // Cloudflare-based proxy (uses 1.1.1.1 DNS)
      `https://api.allorigins.win/raw?url=${encodeURIComponent(tmdbUrl)}`,
      // Alternative proxy services
      `https://corsproxy.io/?${encodeURIComponent(tmdbUrl)}`,
      `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(tmdbUrl)}`,
      // Direct access with custom headers
      tmdbUrl
    ];

    let response;
    let lastError;
    let usedProxy = '';

    for (const proxyUrl of proxyServices) {
      try {
        console.log(`Trying proxy: ${proxyUrl}`);
        
        if (proxyUrl.includes('allorigins.win') || proxyUrl.includes('corsproxy.io') || proxyUrl.includes('codetabs.com')) {
          // Use proxy service
          response = await fetch(proxyUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            },
            // Add timeout
            signal: AbortSignal.timeout(10000)
          });
        } else {
          // Direct access with custom DNS-like headers
          response = await fetch(proxyUrl, {
            method: req.method,
            headers: {
              'Accept': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_AUTH_KEY}`,
              'Content-Type': 'application/json',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'X-Forwarded-For': '1.1.1.1', // Simulate different IP
              'X-Real-IP': '1.1.1.1'
            },
            signal: AbortSignal.timeout(10000)
          });
        }

        if (response.ok) {
          usedProxy = proxyUrl;
          console.log(`Success with proxy: ${proxyUrl}`);
          break;
        } else {
          console.log(`Proxy failed with status: ${response.status}`);
        }
      } catch (error) {
        console.log(`Proxy error: ${error.message}`);
        lastError = error;
        continue;
      }
    }

    if (!response || !response.ok) {
      throw lastError || new Error('All proxy attempts failed');
    }

    const data = await response.json();
    
    console.log(`Successfully served request for: ${path} using: ${usedProxy}`);
    res.status(200).json(data);
    
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'API request failed', 
      message: 'Unable to access TMDB API. All proxy services failed.',
      details: error.message,
      originalUrl: tmdbUrl,
      suggestion: 'Try using a VPN or different network'
    });
  }
}
