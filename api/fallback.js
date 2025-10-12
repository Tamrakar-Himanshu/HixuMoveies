export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // Sample movie data that works without external APIs
  const sampleMovies = {
    trending: {
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
      ]
    },
    popular: {
      results: [
        {
          id: 4,
          title: "Avatar",
          overview: "A paraplegic marine dispatched to the moon Pandora.",
          poster_path: "/kyeqWdyUXW608qlYkRqosgbbJyK.jpg",
          release_date: "2009-12-18",
          vote_average: 7.8
        },
        {
          id: 5,
          title: "Titanic",
          overview: "A seventeen-year-old aristocrat falls in love with a kind but poor artist.",
          poster_path: "/9xjZS2rlVRS8h97NSO3a2lGjhU8.jpg",
          release_date: "1997-12-19",
          vote_average: 7.9
        }
      ]
    }
  };

  const { type } = req.query;
  
  try {
    let data;
    
    if (type === 'trending' || !type) {
      data = sampleMovies.trending;
    } else if (type === 'popular') {
      data = sampleMovies.popular;
    } else {
      data = sampleMovies.trending; // Default
    }
    
    res.status(200).json({
      ...data,
      fallback: true,
      message: "Using fallback data - external APIs not accessible"
    });
    
  } catch (error) {
    res.status(500).json({ 
      error: 'Fallback failed', 
      message: error.message 
    });
  }
}
