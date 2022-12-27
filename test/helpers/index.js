const timers = require('../../index.js')

const nil = new Int32Array(new SharedArrayBuffer(4))

module.exports = { isAround, sleep, countTimers }

function countTimers () {
  let activeTimers = 0
  for (const timer of timers) { // eslint-disable-line no-unused-vars
    activeTimers++
  }
  return activeTimers
}

function isAround (actual, expected) {
  if (!(actual >= expected)) return false
  if (process.env.CI) return true // GitHub CI machines are slow
  return (actual - expected) <= 5
}

function sleep (ms) {
  Atomics.wait(nil, 0, 0, ms)
}
