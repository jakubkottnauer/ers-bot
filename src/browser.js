import launchChrome from '@serverless-chrome/lambda'
import puppeteer from 'puppeteer'
import request from 'request'

export default async function resolveBrowser () {
  if (process.env.APP_ENV === 'local') {
    return await puppeteer.launch()
  } else {
    // AWS Lambda
    const chrome = await launchChrome()
    const debuggerUrl = await getDebuggerUrl(chrome.url)

    return await puppeteer.connect({
      browserWSEndpoint: debuggerUrl
    })
  }
}

function getDebuggerUrl (baseUrl) {
  return new Promise((resolve, reject) => {
    request(
      {
        method: 'GET',
        url: `${baseUrl}/json/version`,
        json: true,
        timeout: 5000
      },
      (e, res, body) => {
        if (e) {
          return reject(e)
        }

        const debuggerUrl = body.webSocketDebuggerUrl

        if (!debuggerUrl) {
          return reject(new Error("Couldn't find debugger url from response"))
        }

        resolve(debuggerUrl)
      }
    )
  })
}
