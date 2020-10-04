const robots = {
  userInput: require('./robots/user-input'),
  text: require('./robots/text'),
};

async function start() {
  const content = {
    maximumSentences: 7,
  };

  await robots.userInput(content);
  await robots.text(content);
}

start();
