import fs from 'fs';
import https from 'https';

const getJSON = (url) => new Promise((resolve, reject) => {
  https.get(url, (res) => {
    let raw = '';
    res.on('data', d => raw += d);
    res.on('end', () => {
      try { resolve(JSON.parse(raw)); } catch(e) { reject(e); }
    });
  }).on('error', reject);
});

async function run() {
  console.log('Fetching Beatles catalogue from iTunes...');
  const url = `https://itunes.apple.com/search?term=the+beatles&media=music&entity=song&limit=400`;
  const data = await getJSON(url);

  console.log(`Initial results: ${data.resultCount}`);
  
  const uniqueSongs = new Map();

  for (const track of data.results) {
    if (!track.trackName || !track.previewUrl || !track.artworkUrl100) continue;
    if (track.artistName !== 'The Beatles') continue;
    
    const ln = track.trackName.toLowerCase();
    if (ln.includes('anthology') || ln.includes('take') || ln.includes('live at') || ln.includes('speech') || ln.includes('interview')) {
      continue;
    }

    let cleanTitle = track.trackName
      .replace(/\s*-\s*[\d]{4}\s+(Mix|Remaster(ed)?).*/i, '') 
      .replace(/\s*\([\d]{4}\s+(Mix|Remaster(ed)?)\)/i, '')
      .replace(/\s*-\s*Remastered(\s*[\d]{4})?.*/i, '')
      .replace(/\s*\(\s*Remastered(\s*[\d]{4})?\s*\)/i, '')
      .replace(/\s*-\s*Super Deluxe.*/i, '')
      .replace(/\s*-\s*Stereo.*/i, '')
      .replace(/\s*\(\s*Stereo.*\)/i, '')
      .replace(/\s*-\s*Mono.*/i, '')
      .trim();

    if (!uniqueSongs.has(cleanTitle)) {
      uniqueSongs.set(cleanTitle, {
        id: track.trackId,
        title: Buffer.from(cleanTitle).toString('base64'),
        previewUrl: track.previewUrl,
        artworkUrl: track.artworkUrl100.replace('100x100bb', '600x600bb'),
      });
    }
  }

  const resultList = Array.from(uniqueSongs.values()).map((song, idx) => {
    delete song._clearTitle;
    song.id = String(idx + 1);
    return song;
  });

  console.log(`Total unique songs: ${resultList.length}`);

  // Save to src/data/songs.json
  fs.writeFileSync('src/data/songs.json', JSON.stringify(resultList, null, 2));
  console.log('Saved to src/data/songs.json');
}

run();
