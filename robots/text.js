const algorithmia = require('algorithmia');
const algorithmiaApiKey = require('../credentials/algorithmia.json').apiKey;
const setenceBoundaryDetection = require('sbd');

const watsonApiKey = require('../credentials/watson-nlu.json').apikey;

const NaturalLanguageUnderstandingV1 = require('ibm-watson/natural-language-understanding/v1');
const { IamAuthenticator } = require('ibm-watson/auth');

var nlu = new NaturalLanguageUnderstandingV1({
  authenticator: new IamAuthenticator({ apikey: watsonApiKey }),
  version: '2018-04-05',
  serviceUrl:
    'https://gateway.watsonplatform.net/natural-language-understanding/api/',
});

// const state = require('./state.js');

async function robot(content) {
  // const content = state.load();
  await fetchContentFromWikipedia(content);
  sanitizeContent(content);
  breakingContentIntoSentences(content);
  limitMaximumSentences(content);
  await fetchKeywordsOfAllSentences(content);
  console.log(JSON.stringify(content, null, 6));

  async function fetchContentFromWikipedia(content) {
    const algorithmiaAuthenticated = algorithmia.client(algorithmiaApiKey);
    const wikipediaAlgorithm = algorithmiaAuthenticated.algo(
      'web/WikipediaParser/0.1.2'
    );
    const wikipediaResponde = await wikipediaAlgorithm.pipe(content.searchTerm);
    const wikipediaContent = await wikipediaResponde.get();

    content.sourceContentOriginal = wikipediaContent.content;
  }
  function sanitizeContent(content) {
    const withoutBlankLinesAndMarkdown = removeBlankLinesAndMarkdown(
      content.sourceContentOriginal
    );
    const withoutDatesInParentheses = removeDatesInParentheses(
      withoutBlankLinesAndMarkdown
    );
    content.sourceContentSanitized = withoutDatesInParentheses;

    function removeBlankLinesAndMarkdown(text) {
      const allLines = text.split('\n');

      const withoutBlankLinesAndMarkdown = allLines.filter((line) => {
        if (
          line.trim().length === 0 ||
          line.trim() == '\n' ||
          line.trim().startsWith('=')
        ) {
          return false;
        }

        return true;
      });

      return withoutBlankLinesAndMarkdown.join(' ');
    }
    function removeDatesInParentheses(text) {
      return text
        .replace(/\((?:\([^()]*\)|[^()])*\)/gm, '')
        .replace(/  /g, ' ');
    }
  }
  function breakingContentIntoSentences(content) {
    content.sentences = [];

    const setences = setenceBoundaryDetection.sentences(
      content.sourceContentSanitized
    );

    setences.forEach((sentence) => {
      content.sentences.push({
        text: sentence,
        keywords: [],
        images: [],
      });
    });
  }
  function limitMaximumSentences(content) {
    content.sentences = content.sentences.slice(0, content.maximumSentences);
  }
  async function fetchKeywordsOfAllSentences(content) {
    for (const sentence of content.sentences) {
      sentence.keywords = await fetchWatsonAndReturnKeywords(sentence.text);
    }
  }
  async function fetchWatsonAndReturnKeywords(sentence) {
    return new Promise((resolve, reject) => {
      nlu
        .analyze({
          html: sentence,
          features: {
            keywords: {},
          },
        })
        .then((response) => {
          const keywords = response.result.keywords.map((keyword) => {
            return keyword.text;
          });

          resolve(keywords);
        })
        .catch((err) => {
          throw new Error(err);
        });
    });
  }
}

module.exports = robot;
