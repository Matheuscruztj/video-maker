const google = require('googleapis').google;
const customSearch = google.customsearch('v1');
const state = require('./state');

const googleSearchCredentials = require('../credentials/google-search.json');

async function robot() {
  const content = state.load();
  await fetchImageOfAllSentences(content);
  console.dir(content, { depth: null });
  process.exit(0);

  async function fetchImageOfAllSentences(content) {
    for (const sentence of content.sentences) {
      const query = `${content.searchTerm} ${sentence.keywords[0]}`;
      sentence.images = await fetchGoogleAndReturnImagesLinks(query);

      sentence.googleSearchQuery = query;
    }
  }

  async function fetchGoogleAndReturnImagesLinks(query) {
    const response = await customSearch.cse.list({
      auth: googleSearchCredentials.apiKey,
      cx: googleSearchCredentials.searchEngineId,
      q: query,
      searchType: 'image',
      imgSize: 'huge',
      num: 2,
    });

    const imagesUrl = response.data.items.map((item) => {
      return item.link;
    });

    return imagesUrl;
  }
}

module.exports = robot;
