'use strict'
const fetch = require('node-fetch');

const baseUrl = process.env.PRODUCT_MANAGEMENT_BASE_URL;

const paths = {
    loginPath: '/auth/local',
    enabledProducts: '/productos?enabled=true',
    updateProduct: '/productos/:id'
}

async function authenticateAndSaveJwt(){
    try{
        const loginUrl = `${baseUrl}${paths.loginPath}`
        const body = {
            identifier: process.env.PRODUCT_MANAGEMENT_EMAIL,
            password: process.env.PRODUCT_MANAGEMENT_PASSWORD,
          }
        const response = await fetch(loginUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        process.env.PRODUCT_MANAGEMENT_JWT = (await response.json()).jwt;
    }catch(e){
        console.log(e)
    }
}

async function getEnabledProducts(){
    try{
        const enabledProductsUrl = `${baseUrl}${paths.enabledProducts}`
        const headers = {
            Authorization : `Bearer ${process.env.PRODUCT_MANAGEMENT_JWT}`
        }
        const response = await fetch(enabledProductsUrl, headers);
        return await response.json();
    }catch(e){
        console.log(e);
    }
}

async function updateProduct(product){
    try{
        const updateUrl = `${baseUrl}${paths.updateProduct}`.replace(':id', product.id);
        const headers = {
            Authorization : `Bearer ${process.env.PRODUCT_MANAGEMENT_JWT}`,
            'Content-Type': 'application/json'
        };
        const response = await fetch(updateUrl, {
            method: 'PUT',
            headers,
            body: JSON.stringify(product)
        });
        if(!response.ok){
            throw new Error("Something went wrong updating!")
        }
    }catch(error){
        console.log(error);
    }
}

module.exports = {
    authenticateAndSaveJwt,
    getEnabledProducts,
    updateProduct
}