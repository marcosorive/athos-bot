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
const pino = require('pino')

const logger = pino(pino.destination({
    dest: './bot.log',
    minLength: 4096,
    sync: true,
    level: 'debug'
}));

puppeteer.use(StealthPlugin())
puppeteer.use(AdblockerPlugin({ blockTrackers: true }))
authenticateAndSaveJwt();

async function updatePrices(){
    logger.debug("--- Begin price checks --- ")
    const _browser = await puppeteer.launch({headless: false});
    logger.debug("-> Browser started")
    try{
        const enabledProducts = await getEnabledProducts();
        logger.debug("-> Enabled products obtained")
        enabledProducts.forEach((product) => {
            logger.debug(`-> Checking product with name ${product.name}`)
            let currentLowest = product.absolute_minimum || 99999999;
            const newProduct = {...product};
            product.stores.forEach(async (store, storeIndex) => {
                logger.debug(`-> Checking store ${store.name} for ${product.name}`)
                let newCurrent = await getPrice(_browser, store);
                logger.debug(`-> Price is ${newCurrent}`)
                if(newCurrent < store.current_price){
                    // Notify the user
                    logger.debug(`-> Price is lowest (${newCurrent}) than the current (${store.current_price}). Updating.`)
                    newProduct.stores[storeIndex].current_price = newCurrent;
                }
                if(newCurrent < currentLowest){
                    currentLowest = newCurrent;
                }
            });
            if(currentLowest < product.absolute_minimum){
                logger.debug(`-> Reached a new lowest (${currentLowest})`);
                newProduct.absolute_minimum = currentLowest;
            }
            if(! equal(product, newProduct)){
                logger.debug(`-> Product has changed, updating product in strapi.`)
                updateProduct(newProduct);
            }
            sleep(10000);
        });
    }catch(error){
        console.log('Updateprices: ' + error);
    }finally{
        _browser.close();
    }
}

updatePrices();