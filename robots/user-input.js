const readline = require('readline-sync');
const state = require('./state.js');

function robot(content) {
  content.searchTerm = askAndReturnSearchTerm();
  content.prefix = askAndReturnPrefix();
  // state.save(content);

  function askAndReturnSearchTerm() {
    return readline.question('Type a Wikipedia search term: ');
  }

  function askAndReturnPrefix() {
    const prefixes = ['Who is', 'What is', 'The history of'];
    const selectedPrefixIndex = readline.keyInSelect(
      prefixes,
      'Choose one option: '
    );
    const selectedPrefixTest = prefixes[selectedPrefixIndex];

    return selectedPrefixTest;
  }
}

module.exports = robot;
