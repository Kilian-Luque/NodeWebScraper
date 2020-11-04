# NodeWebScraper
This Web Scraper was born just for educational purposes. Its function is to extract data of the smartphones for sale in https://mediamarkt.es

The Web Scraper has two versions:
- webscraper_v1.js
  
  What does it do?
  
  Just extract the data of the smartphones for sale from the website and show it in console.
  
  How to execute?
  
  No parameters needed.
  
  Just type "node webscraper_v1.js"

- webscraper_v2.js

  What does it do?
  
  Extract the data of the products that match with a given search text and a given price (or range of prices) and it's sent to the interested Slack users by a Slack bot.
  
  How to execute?
  
  Needs at least two parameters: a search text and a price. A third parameter can be included as optional: a maximum price, to set a range of prices [price, maximumprice].
  
  Type "node webscraper_v2.js (search_text*) (price*) (maximumprice)"
