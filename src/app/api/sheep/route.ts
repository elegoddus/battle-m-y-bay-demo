import { NextResponse } from 'next/server';

// Local cartoon sheep fallback pool
const FALLBACK_POOL = [
  '/sheep_cartoon_1.png',
  '/sheep_cartoon_2.png',
  '/sheep_cartoon_3.png',
  '/sheep_cartoon_4.png',
  '/sheep_cartoon_5.png',
  '/sheep_cartoon_6.png'
];

// Predefined cartoon and illustration search criteria on Pixabay
const SEARCH_QUERIES = [
  { q: 'cartoon sheep', type: 'illustration' },
  { q: 'cartoon sheep', type: 'vector' },
  { q: 'cute lamb cartoon', type: 'illustration' },
  { q: 'sheep illustration', type: 'illustration' },
  { q: 'sleeping sheep cartoon', type: 'illustration' }
];

export async function GET() {
  const apiKey = process.env.PIXABAY_API_KEY;

  if (apiKey) {
    // Select a random query to keep the image results fresh and diverse
    const selected = SEARCH_QUERIES[Math.floor(Math.random() * SEARCH_QUERIES.length)];
    const url = `https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(selected.q)}&image_type=${selected.type}&safesearch=true&per_page=60`;

    try {
      const res = await fetch(url, {
        next: { revalidate: 0 } // disable backend routing cache
      });

      if (res.ok) {
        const data = await res.json();
        if (data.hits && data.hits.length > 0) {
          // Select a random image from the matches
          const randomHit = data.hits[Math.floor(Math.random() * data.hits.length)];
          // Pixabay webformatURL provides optimized 640px wide images, perfect for our small square box
          const imageUrl = randomHit.webformatURL || randomHit.largeImageURL;
          if (imageUrl) {
            return NextResponse.json({ url: imageUrl, keyword: selected.q });
          }
        }
      }
    } catch (e) {
      console.error('Pixabay API fetch failed:', e);
    }
  }

  // Fallback to local custom generated cartoon sheep
  const randomImage = FALLBACK_POOL[Math.floor(Math.random() * FALLBACK_POOL.length)];
  return NextResponse.json({ url: randomImage, keyword: 'local cartoon sheep' });
}
