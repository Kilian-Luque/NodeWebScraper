const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

async function extractData(searchstring, minprice, maxprice) {
    console.log("Extracting data...");

    Promise.all(await getAllPagesData(searchstring, minprice, maxprice))
    .then(results => {
        for (result of results) {
            console.log(result);
            let data = JSON.stringify(result);
            fs.writeFile('data.json', data);
        }
    })
    .catch(err => {
        console.log("Something went wrong.");
    })
}

function getAllPagesData(searchstring, minprice, maxprice) {
    let url;
    if (minprice) {
        url = `https://www.mediamarkt.es/es/search.html?searchParams=%2FSearch.ff%3Fquery%3D${searchstring}%26filterTabbedCategory%3Donlineshop%26filteravailability%3D1%26channel%3Dmmeses%26productsPerPage%3D20%26followSearch%3D9790%26filtercurrentprice%3D${minprice}%2B-%2B${maxprice}&searchProfile=onlineshop&query=${searchstring}&sort=&page=&sourceRef=INVALID`;
    } else {
        url = `https://www.mediamarkt.es/es/search.html?query=${searchstring}&searchProfile=onlineshop&channel=mmeses`;
    }

    return axios.get(url).then(async response => {
        var $ = cheerio.load(response.data);

        let numPages = parseInt($( ".pagination li" ).last().prev().text());

        if (!numPages) {
            const anyResult = $( "hgroup.cf h1" ).text();
            if (anyResult) {
                numPages = 2;
            }
        }

        let promises = [];

        for (let index = 1; index <= numPages; index++) {
            let pageurl;
            if (minprice !== undefined) {
                pageurl = `https://www.mediamarkt.es/es/search.html?searchParams=%2FSearch.ff%3Fquery%3D${searchstring}%26filterTabbedCategory%3Donlineshop%26filteravailability%3D1%26filtercurrentprice%3D${minprice}%2B-%2B${maxprice}%26channel%3Dmmeses%26productsPerPage%3D20%26followSearch%3D9790&searchProfile=onlineshop&query=${searchstring}&sort=&page=${index}&sourceRef=INVALID`;
            } else {
                pageurl = `https://www.mediamarkt.es/es/search.html?searchParams=%2FSearch.ff%3Fquery%3D${searchstring}%26filterTabbedCategory%3Donlineshop%26filteravailability%3D1%26channel%3Dmmeses%26productsPerPage%3D20%26followSearch%3D9790&searchProfile=onlineshop&query=${searchstring}&sort=&page=${index}&sourceRef=INVALID`;
            }
            
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

const searchstring = process.argv[2];
const minprice = process.argv[3];
let maxprice = process.argv[4];

if (searchstring === undefined) {
    console.log("Error: Enter a search parameter.")
} else {
    if (minprice !== undefined && maxprice === undefined) {
        maxprice = minprice;
    }
    checkPrice(minprice, maxprice) ? extractData(searchstring, minprice, maxprice) : console.log("Error: Enter valid price or price range.");
}

function checkPrice(min, max) {
    min = parseInt(min);
    max = parseInt(max);

    if (min > max) {
        return false;
    } else if (Number.isInteger(min)) {
        if (min < 0 || min > 4000) {
            return false;
        } else {
            if (Number.isInteger(max)) {
                if (max < 0 || max > 4000) {
                    return false;
                }
            } else {
                return false;
            }
        }
    } else {
        return false;
    }

    return true;
}