import launchChrome from '@serverless-chrome/lambda'
import puppeteer from 'puppeteer'
import * as request from 'superagent'

// Launching Chrome on AWS inspired by https://nadeesha.github.io/headless-chrome-puppeteer-lambda-servelerless/
export default async function resolveBrowser () {
  if (process.env.APP_ENV === 'AWS') {
    const chrome = await launchChrome()
    const response = await request
      .get(`${chrome.url}/json/version`)
      .set('Content-Type', 'application/json')

    const endpoint = response.body.webSocketDebuggerUrl

    return await puppeteer.connect({
      browserWSEndpoint: endpoint
    })
  } else {
    return await puppeteer.launch()
  }
}
