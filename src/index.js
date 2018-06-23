import 'babel-core/register'
import 'babel-polyfill'
import moment from 'moment'
import puppeteer from 'puppeteer'
import { whoMap, cookies, url } from './config.js'
import program from 'commander'

const WAIT_FOR = 500
let isTest = true

const daysMap = {
  fr: 5,
  fri: 5,
  mo: 1,
  mon: 1,
  sa: 6,
  sat: 6,
  su: 7,
  sun: 7,
  th: 4,
  thu: 4,
  tu: 2,
  tue: 2,
  we: 3,
  wed: 3
}

// Pass index of the next day to find the next instance of the day. 1 is Monday, 7 is Sunday
const getNextDayInstance = day =>
  moment().isoWeekday() < day
    ? moment().isoWeekday(day)
    : moment()
      .add(1, 'weeks')
      .isoWeekday(day)

const nextMonth = async page => {
  const month = await page.$('a[data-handler="next"]')
  await month.click()
  await page.waitFor(WAIT_FOR)
}

const prevMonth = async page => {
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
  await page.screenshot({ path: `screenshots/confirm_${Math.random()}.png` })
  await terms.click()
}

const confirm = async page => {
  const confirmButton = (await page.$$('.ui-dialog-buttonset button'))[0]
  await page.screenshot({ path: `screenshots/confirm_${Math.random()}.png` })
  if (!isTest) {
    await confirmButton.click()
    console.log('  -> Training booked')
  }
}
const fixTime = p => (p.indexOf(':') !== -1 ? p : `${p}:00`)
const fixTrainer = p => whoMap[p]
const fixDay = p => daysMap[p]
;(async () => {
  program
    .option('-p, --prod', 'Production mode')
    .option('-d, --day [day]', 'Day', fixDay)
    .option('-t, --time [time]', 'Time', fixTime)
    .option('-w, --who [trainer]', 'Trainer', fixTrainer)
    .parse(process.argv)

  isTest = !program.prod

  const browser = await puppeteer.launch()

  for (let client of Object.keys(cookies)) {
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

    const nextDay = getNextDayInstance(program.day)
    await page.goto(url)
    await page.waitFor(WAIT_FOR)

    await selectDateInCalendar(page, nextDay.date(), nextDay.month())
    const trainingFound = await selectTraining(page, program.time, program.who)
    if (trainingFound) {
      console.log(`${client} - training with ${program.who} found`)
    } else {
      console.log(`${client} - training with ${program.who} not found!`)
      return
    }

    await checkTerms(page)
    await confirm(page)
    await page.waitFor(WAIT_FOR)
  }

  await browser.close()
})()
