export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    // Test different DNS resolution approaches
    const testUrls = [
      'https://api.themoviedb.org/3/trending/all/day',
      'https://api.themoviedb.org/3/movie/popular',
      'https://api.themoviedb.org/3/tv/popular'
    ];

    const results = [];
    
    for (const testUrl of testUrls) {
      const proxyServices = [
        `https://api.allorigins.win/raw?url=${encodeURIComponent(testUrl)}`,
        `https://corsproxy.io/?${encodeURIComponent(testUrl)}`,
        `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(testUrl)}`
      ];

      let success = false;
      let workingProxy = '';

      for (const proxyUrl of proxyServices) {
        try {
          console.log(`Testing: ${proxyUrl}`);
          
          const response = await fetch(proxyUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
            signal: AbortSignal.timeout(5000)
          });

          if (response.ok) {
            const data = await response.json();
            if (data && (data.results || data.page)) {
              success = true;
              workingProxy = proxyUrl;
              break;
            }
          }
        } catch (error) {
          console.log(`Proxy failed: ${error.message}`);
          continue;
        }
      }

      results.push({
        url: testUrl,
        success: success,
        workingProxy: workingProxy
      });
    }

    res.status(200).json({
      message: 'DNS and proxy test results',
      results: results,
      summary: {
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    });
    
  } catch (error) {
    console.error('DNS test error:', error);
    res.status(500).json({ 
      error: 'DNS test failed', 
      message: error.message 
    });
  }
}
