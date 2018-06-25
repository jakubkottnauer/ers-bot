import 'babel-register'
import 'babel-polyfill'

import program from 'commander'
import book from './core'

const fixTime = p => (p.indexOf(':') !== -1 ? p : `${p}:00`)
;(async () => {
  program
    .option('-p, --prod', 'Production mode')
    .option('-d, --day [day]', 'Day')
    .option('-t, --time [time]', 'Time', fixTime)
    .option('-w, --who [trainer]', 'Trainer')
    .parse(process.argv)

  await book(program.day, program.time, program.who, !program.prod)
})()
