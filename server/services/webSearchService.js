const axios = require('axios');

const manualWebsites = [
  {
    keywords: /coding practice|practice coding|websites to practice coding|coding websites|best sites for coding|top sites for coding|resources for coding|links to practice coding|practice coding links|coding practice platforms|coding challenges|coding interview practice/i,
    results: [
      { title: 'LeetCode', url: 'https://leetcode.com/' },
      { title: 'HackerRank', url: 'https://www.hackerrank.com/' },
      { title: 'Codewars', url: 'https://www.codewars.com/' },
      { title: 'Codecademy', url: 'https://www.codecademy.com/' },
      { title: 'freeCodeCamp', url: 'https://www.freecodecamp.org/' },
      { title: 'Project Euler', url: 'https://projecteuler.net/' },
      { title: 'Edabit', url: 'https://edabit.com/' },
      { title: 'CodingBat', url: 'https://codingbat.com/' },
      { title: 'Exercism', url: 'https://exercism.org/' },
      { title: 'CodeSignal', url: 'https://codesignal.com/' },
      { title: 'CodeCombat', url: 'https://codecombat.com/' },
      { title: 'CheckiO', url: 'https://checkio.org/' }
    ]
  }
];

async function webSearch(query) {
  // Manual fallback first
  for (const entry of manualWebsites) {
    if (entry.keywords.test(query)) {
      return entry.results;
    }
  }
  // Otherwise, use DuckDuckGo
  const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_redirect=1&no_html=1`;
  const response = await axios.get(url);
  const data = response.data;

  let links = [];
  if (data.Results) {
    links = links.concat(data.Results.map(r => ({ title: r.Text, url: r.FirstURL })));
  }
  if (data.RelatedTopics) {
    data.RelatedTopics.forEach(topic => {
      if (topic.FirstURL && topic.Text) {
        links.push({ title: topic.Text, url: topic.FirstURL });
      } else if (topic.Topics) {
        topic.Topics.forEach(sub => {
          if (sub.FirstURL && sub.Text) {
            links.push({ title: sub.Text, url: sub.FirstURL });
          }
        });
      }
    });
  }
  return links;
}

module.exports = { webSearch }; 