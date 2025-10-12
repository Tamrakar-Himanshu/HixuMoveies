// Helper function to get alternative API URLs
function getAlternativeAPIUrl(path, queryParams) {
  // OMDb API alternatives
  if (path.includes('movie/') && !path.includes('/')) {
    const movieId = path.split('/')[1];
    return `https://www.omdbapi.com/?apikey=${import.meta.env.VITE_OMDB_KEY}&i=${movieId}`;
  }
  
  if (path.includes('trending')) {
    return `https://www.omdbapi.com/?apikey=${import.meta.env.VITE_OMDB_KEY}&s=movie&type=movie&page=1`;
  }
  
  if (path.includes('popular')) {
    return `https://www.omdbapi.com/?apikey=${import.meta.env.VITE_OMDB_KEY}&s=movie&type=movie&page=1`;
  }
  
  return null;
}

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
    // Try alternative APIs first (these work in India)
    const alternativeAPIs = [
      // OMDb API (works globally)
      `https://www.omdbapi.com/?apikey=${import.meta.env.VITE_OMDB_KEY}&s=movie&type=movie`,
      // TVMaze API (works globally)
      `https://api.tvmaze.com/search/shows?q=movie`,
      // JustWatch API (works globally)
      `https://apis.justwatch.com/content/titles/en_IN/popular`,
    ];

    // If it's a specific movie/TV request, try alternatives first
    if (path.includes('movie/') || path.includes('tv/') || path.includes('trending')) {
      // Try alternative APIs for specific content
      const alternativeUrl = getAlternativeAPIUrl(path, queryParams);
      if (alternativeUrl) {
        try {
          const altResponse = await fetch(alternativeUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
            signal: AbortSignal.timeout(5000)
          });

          if (altResponse.ok) {
            const altData = await altResponse.json();
            console.log(`Success with alternative API: ${alternativeUrl}`);
            return res.status(200).json(altData);
          }
        } catch (error) {
          console.log(`Alternative API failed: ${error.message}`);
        }
      }
    }

    // Fallback to proxy services
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
    
    // Comprehensive data validation
    if (!data) {
      throw new Error('Empty response from proxy');
    }
    
    // Check if it's a valid TMDB response
    if (data.error) {
      throw new Error(`TMDB API error: ${data.error}`);
    }
    
    // Ensure data has the expected structure
    if (data.results && !Array.isArray(data.results)) {
      throw new Error('Invalid data structure: results is not an array');
    }
    
    // If no results array, create a safe fallback
    if (!data.results) {
      data.results = [];
    }
    
    // Ensure each result has required fields
    if (Array.isArray(data.results)) {
      data.results = data.results.map(item => ({
        id: item.id || Math.random(),
        title: item.title || item.name || 'Unknown Title',
        overview: item.overview || 'No description available',
        poster_path: item.poster_path || '/noimage.webp',
        release_date: item.release_date || item.first_air_date || 'Unknown Date',
        vote_average: item.vote_average || 0,
        ...item
      }));
    }
    
    console.log(`Successfully served request for: ${path} using: ${usedProxy}`);
    res.status(200).json(data);
    
  } catch (error) {
    console.error('API Error:', error);
    
    // Return fallback data instead of error
    const fallbackData = {
      results: [
        {
          id: 1,
          title: "The Dark Knight",
          overview: "Batman faces the Joker in this epic superhero film.",
          poster_path: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
          release_date: "2008-07-18",
          vote_average: 9.0
        },
        {
          id: 2,
          title: "Inception",
          overview: "A thief who steals corporate secrets through dream-sharing technology.",
          poster_path: "/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
          release_date: "2010-07-16",
          vote_average: 8.8
        },
        {
          id: 3,
          title: "Interstellar",
          overview: "A team of explorers travel through a wormhole in space.",
          poster_path: "/rAiYTfKGqDCRIIqo664sY9XZIvQ.jpg",
          release_date: "2014-11-05",
          vote_average: 8.6
        }
      ],
      page: 1,
      total_pages: 1,
      total_results: 3,
      fallback: true,
      message: "Using fallback data - external APIs not accessible"
    };
    
    res.status(200).json(fallbackData);
  }
}
