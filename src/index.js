import 'babel-core/register'
import 'babel-polyfill'
import moment from 'moment'
import puppeteer from 'puppeteer'

import { dayTimePairs, cookies, url } from './config.js'

// Pass index of the next day to find the next instance of the day. 1 is Monday, 7 is Sunday
const getNextDayInstance = day =>
  moment().isoWeekday() < day
    ? moment().isoWeekday(day)
    : moment()
      .add(1, 'weeks')
      .isoWeekday(day)

const WAIT_FOR = 1000

const selectDateInCalendar = async (page, day, month) => {
  const isCorrectMonth = (await page.$$(`td[data-month="${month}"]`)).length > 0
  if (!isCorrectMonth) {
    const nextMonth = await page.$$(`td[data-handler="next"]`)
    await nextMonth.click()
    await page.waitFor(WAIT_FOR)
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
  for (let training of trainingsOnDay) {
    const text = await (await training.getProperty('innerHTML')).jsonValue()

    if (text.indexOf(`>${time}`) > 0 && text.indexOf(name) > 0) {
      console.log('Found training', text)
      await training.click()
      await page.waitFor(WAIT_FOR)
      break
    }
  }
}

const checkTerms = async page => {
  const terms = await page.$('input#terms')
  await terms.click()
}

const confirm = async page => {
  const confirmButton = (await page.$$('.ui-dialog-buttonset button'))[0]
  await page.screenshot({ path: `screenshots/confirm_${Math.random()}.png` })
  await confirmButton.click()
}
;(async () => {
  const browser = await puppeteer.launch()

  for (let client of Object.keys(cookies)) {
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
      await selectTraining(page, pair[1], pair[2])
      await checkTerms(page)
      await confirm(page)
    }
  }

  await browser.close()
})()
