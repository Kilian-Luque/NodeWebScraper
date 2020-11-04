var axios = require('axios');
var cheerio = require('cheerio');
const fs = require('fs');

async function extractData() {
    console.log("Extracting data...");

    Promise.all(await getAllPagesData())
    .then(results => {
        for (result of results) {
            console.log(result);
            let data = JSON.stringify(result);
            fs.writeFile('smartphones.json', data);
        }
    })
    .catch(err => {
        console.log("Something went wrong.");
    })
}

function getAllPagesData() {
    var url = 'https://www.mediamarkt.es/es/category/_smartphones-701189.html';

    return axios.get(url).then(async response => {
        var $ = cheerio.load(response.data);

        let numPages = parseInt($( ".pagination li" ).last().prev().text());

        let promises = [];

        for (let index = 1; index <= numPages; index++) {
            let pageurl = `https://www.mediamarkt.es/es/category/_smartphones-701189.html?searchParams=&sort=&view=PRODUCTLIST&page=${index}`;
            let promise = await waitToResolve(pageurl, 250);

            promises.push(promise);
        }

        return promises;
    });
}

function waitToResolve(url, ms) {
    return new Promise(resolve => {
        setTimeout(async () => resolve(await getPageData(url)), ms);
    });
}

function getPageData(url) {
    return axios.get(url).then(response => {
        var $ = cheerio.load(response.data);
    
        const smartphoneElements = $('.products-list .product-wrapper');

        let smartphones = [];
    
        for (let i = 0; i < smartphoneElements.length; i++) {
            let smartphone = {
                title: "",
                description: {},
                image_url: "",
                price: 0
            };
    
            smartphone.title = $($(smartphoneElements[i]).find('.content h2 a')[0]).text().trim();
    
            let descriptionElements = $($(smartphoneElements[i]).find('.product-details dt'));
    
            for (let i = 0; i < descriptionElements.length; i++) {
                let description_dt = $($(smartphoneElements[i]).find('.product-details dt')[i]).text();
                let description_dt_key = description_dt.slice(0, description_dt.length - 1);
                let description_dd = $($(smartphoneElements[i]).find('.product-details dd')[i]).text();
                
                smartphone.description[description_dt_key] = description_dd;
            }

            let imageElement = $($(smartphoneElements[i]).find('.photo.clickable img')[0]);
            let image_url = imageElement.attr('data-original');

            smartphone.image_url = image_url;

            let priceElement = $($(smartphoneElements[i]).find('.price.small')[0]);
            let price = parseFloat(priceElement.text().replace(',', '.')).toFixed(2);
    
            smartphone.price = price;
    
            smartphones.push(smartphone);
        }

        return smartphones;
    });
}

extractData();