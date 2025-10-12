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
  const url = `https://api.themoviedb.org/3/${path}${queryString ? '?' + queryString : ''}`;
  
  try {
    const response = await fetch(url, {
      method: req.method,
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${process.env.VITE_AUTH_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    res.status(response.status).json(data);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
