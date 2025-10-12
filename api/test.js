export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    // Test the proxy service
    const testUrl = 'https://api.themoviedb.org/3/trending/all/day';
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(testUrl)}`;
    
    console.log('Testing proxy with URL:', proxyUrl);
    
    const response = await fetch(proxyUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`Proxy test failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    res.status(200).json({
      success: true,
      message: 'Proxy test successful',
      data: data,
      proxyUrl: proxyUrl
    });
    
  } catch (error) {
    console.error('Proxy test error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Proxy test failed', 
      message: error.message 
    });
  }
}
