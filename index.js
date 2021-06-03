'use strict'
require('dotenv').config()
// const Telegraf = require('telegraf')

// const bot = new Telegraf(process.env.BOT_TOKEN)

// const cron = require('node-cron');

// cron.schedule('0 9 * * MON', () => {
//   // send the message here
//   bot.telegram.sendMessage(12345678, "scheduled message");
// });

// bot.launch()

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker');
const {authenticateAndSaveJwt, getEnabledProducts, updateProduct} = require('./api');
const { getPrice } = require('./scrapper');
const {sleep} = require('./utils');
const equal = require('fast-deep-equal');
const logger = require('pino')()

puppeteer.use(StealthPlugin())
puppeteer.use(AdblockerPlugin({ blockTrackers: true }))
authenticateAndSaveJwt();

async function updatePrices(){
    logger.info("--- Begin price checks --- ")
    const _browser = await puppeteer.launch({headless: false});
    logger.info("-> Browser started")
    try{
        const enabledProducts = await getEnabledProducts();
        logger.info("-> Enabled products obtained")
        enabledProducts.forEach((product) => {
            console.log(product.name)
            logger.info(`-> Checking product with name ${product.name}`)
            let currentLowest = product.absolute_minimum || 99999999;
            const newProduct = {...product};
            product.stores.forEach(async (store, storeIndex) => {
                console.log(store.url, storeIndex)
                logger.info(`-> Checking store ${store.name} for ${product.name}`)
                let newCurrent = await getPrice(_browser, store);
                logger.info(`-> Price is ${newCurrent}`)
                // if(newCurrent < store.current_price){
                //     // Notify the user
                //     logger.info(`-> Price is lowest (${newCurrent}) than the current (${store.current_price}). Updating.`)
                //     newProduct.stores[storeIndex].current_price = newCurrent;
                // }
                // if(newCurrent < currentLowest){
                //     currentLowest = newCurrent;
                // }
            });
            // if(currentLowest < product.absolute_minimum){
            //     logger.info(`-> Reached a new lowest (${currentLowest})`);
            //     newProduct.absolute_minimum = currentLowest;
            // }
            // if(! equal(product, newProduct)){
            //     logger.info(`-> Product has changed, updating product in strapi.`)
            //     updateProduct(newProduct);
            // }
            // sleep(10000);
        });
    }catch(error){
        console.log('Updateprices: ' + error);
    }
}

updatePrices();