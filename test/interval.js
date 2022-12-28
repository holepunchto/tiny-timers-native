const test = require('brittle')
const timers = require('../index.js')
const { isAround, countTimers } = require('./helpers/index.js')

test('setInterval', async function (t) {
  t.plan(5)

  const started = Date.now()

  t.is(countTimers(), 0, 'count before setting an interval')

  const id = timers.setInterval(function () {
    t.ok(isAround(Date.now() - started, 50), 'timers took ' + Math.abs(Date.now() - started) + 'ms')

    t.is(countTimers(), 1, 'count inside of interval')
    timers.clearInterval(id)
    t.is(countTimers(), 0, 'count after clearing interval')
  }, 50)

  t.is(countTimers(), 1, 'count after setting an interval')
})

/* test.skip('setInterval multiple cycles', async function (t) {
  t.plan(9)

  let started = Date.now()
  let intervalCount = 0

  t.is(countTimers(), 0, 'count before setting an interval')

  const id = timers.setInterval(function () {
    t.ok(isAround(Date.now() - started, 50), 'timers took ' + Math.abs(Date.now() - started) + 'ms')
    started = Date.now()

    t.is(countTimers(), 1, 'count inside of interval') // + this should be 1?

    if (++intervalCount === 3) {
      timers.clearInterval(id)
      t.is(countTimers(), 0, 'count after clearing interval')
    }
  }, 50)

  t.is(countTimers(), 1, 'count after setting an interval')
}) */

test('setInterval timer active', async function (t) {
  t.plan(3)

  const timer = timers.setInterval(function () {
    t.ok(timer.active)
    timers.clearInterval(timer)
    t.absent(timer.active)
  }, 50)

  t.ok(timer.active)
})

/* test('interrupt setInterval with CPU overhead', async function (t) {
  t.plan(2)

  const started = Date.now()

  const id = timers.setInterval(function () {
    t.ok(isAround(Date.now() - started, 75), 'timers took ' + Math.abs(Date.now() - started) + 'ms')
    timers.clearInterval(id)
    t.is(countTimers(), 0)
  }, 50)

  while (Date.now() - started < 75) {} // eslint-disable-line no-empty
})

test('interrupt setInterval with Atomics.wait', async function (t) {
  t.plan(2)

  const started = Date.now()

  const id = timers.setInterval(function () {
    t.ok(isAround(Date.now() - started, 75), 'timers took ' + Math.abs(Date.now() - started) + 'ms')
    timers.clearInterval(id)
    t.is(countTimers(), 0)
  }, 50)

  sleep(75)
})

test.skip('multiple setInterval', async function (t) {
  t.plan(10)

  const started = Date.now()

  t.is(countTimers(), 0)

  const id1 = timers.setInterval(function () {
    t.ok(isAround(Date.now() - started, 20), '1st timer took ' + Math.abs(Date.now() - started) + 'ms')
    timers.clearInterval(id1)
  }, 20)

  t.is(countTimers(), 1)

  const id2 = timers.setInterval(function () {
    t.ok(isAround(Date.now() - started, 50), '2nd timer took ' + Math.abs(Date.now() - started) + 'ms')
    timers.clearInterval(id2)
    t.is(countTimers(), 0)
  }, 50)

  t.is(countTimers(), 2)

  const id3 = timers.setInterval(function () {
    t.ok(isAround(Date.now() - started, 20), '3rd timer took ' + Math.abs(Date.now() - started) + 'ms')
    timers.clearInterval(id3)
  }, 20)

  t.is(countTimers(), 3)

  const id4 = timers.setInterval(() => {
    t.ok(isAround(Date.now() - started, 0), '4th timer took ' + Math.abs(Date.now() - started) + 'ms')
    timers.clearInterval(id4)
  }, 1)

  t.is(countTimers(), 4)
}) */

test('clearInterval', async function (t) {
  t.plan(2)

  const id = timers.setInterval(() => t.fail('interval should not be called'), 20)

  t.is(countTimers(), 1)
  timers.clearInterval(id)
  t.is(countTimers(), 0)
})
