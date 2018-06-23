import 'babel-core/register'
import 'babel-polyfill'

import program from 'commander'
import { whoMap } from './config.js'
import book from './core'

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

  await book(program.day, program.time, program.who, !program.prod)
})()
