import 'babel-core/register'
import 'babel-polyfill'
import moment from 'moment'
import puppeteer from 'puppeteer'
import { dayTimePairs, cookies, url } from './config.js'

const WAIT_FOR = 1000
const IS_TEST = true

// Pass index of the next day to find the next instance of the day. 1 is Monday, 7 is Sunday
const getNextDayInstance = day =>
  moment().isoWeekday() < day
    ? moment().isoWeekday(day)
    : moment()
      .add(1, 'weeks')
      .isoWeekday(day)

const nextMonth = async (page) => {
  const month = await page.$('a[data-handler="next"]')
  await month.click()
  await page.waitFor(WAIT_FOR)
}

const prevMonth = async (page) => {
  const month = await page.$('a[data-handler="prev"]')
  await month.click()
  await page.waitFor(WAIT_FOR)
}

const selectDateInCalendar = async (page, day, month) => {
  const isCorrectMonth = (await page.$$(`td[data-month="${month}"]`)).length > 0

  if (!isCorrectMonth) {
    await nextMonth(page)

    const isCorrectNow = (await page.$$(`td[data-month="${month}"]`)).length > 0
    if (!isCorrectNow) {
      // Move two months back
      await prevMonth(page)
      await prevMonth(page)
    }
  }

  const calendarElems = await page.$$('.ui-datepicker-calendar tbody a')
  for (let elem of calendarElems) {
    const text = await (await elem.getProperty('innerHTML')).jsonValue()

    if (text === day.toString()) {
      await elem.click()
      await page.waitFor(WAIT_FOR)
      break
    }
  }
}

const selectTraining = async (page, time, name) => {
  const trainingsOnDay = await page.$$('a.slot')
  let found = false
  for (let training of trainingsOnDay) {
    const text = await (await training.getProperty('innerHTML')).jsonValue()

    if (text.indexOf(`>${time}`) > 0 && text.indexOf(name) > 0) {
      found = true
      await training.click()
      await page.waitFor(WAIT_FOR)
      break
    }
  }

  return found
}

const checkTerms = async page => {
  const terms = await page.$('input#terms')
  await terms.click()
}

const confirm = async page => {
  const confirmButton = (await page.$$('.ui-dialog-buttonset button'))[0]
  await page.screenshot({ path: `screenshots/confirm_${Math.random()}.png` })
  if (!IS_TEST) {
    await confirmButton.click()
    console.log('  -> Training booked')
  }
}
;(async () => {
  console.log(IS_TEST ? 'TEST MODE\n' : 'PROD MODE')

  const browser = await puppeteer.launch()

  await Promise.all(
    Object.keys(cookies).map(async client => {
      console.log(`Running for "${client}"\n-----------------`)

      const page = await browser.newPage()

      await page.setCookie(
        ...['PHPSESSID', 'email', 'password'].map(c => ({
          name: c,
          value: cookies[client][c],
          expires: -1,
          domain: 'ersworkout.isportsystem.cz',
          path: '/',
          session: true
        }))
      )

      for (let pair of dayTimePairs) {
        const nextDay = getNextDayInstance(pair[0])
        await page.goto(url)
        await page.waitFor(WAIT_FOR)

        await selectDateInCalendar(page, nextDay.date(), nextDay.month())
        const trainingFound = await selectTraining(page, pair[1], pair[2])
        if (trainingFound) {
          console.log(`${client} - training ${pair} found`)
        } else {
          console.log(`${client} - training ${pair} not found!`)
          continue
        }

        await checkTerms(page)
        await confirm(page)
      }
    })
  )

  await browser.close()
})()
