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
    const browser = await puppeteer.connect({
      browserWSEndpoint: endpoint
    })
    return { browser, chrome }
  } else {
    const browser = await puppeteer.launch()
    return { browser }
  }
}
