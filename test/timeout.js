const test = require('brittle')
const timers = require('../index.js')
const { isAround, sleep, countTimers } = require('./helpers/index.js')

test('setTimeout', async function (t) {
  t.plan(4)

  const started = Date.now()

  t.is(countTimers(), 0)

  timers.setTimeout(function () {
    t.ok(isAround(Date.now() - started, 50), 'timers took ' + Math.abs(Date.now() - started) + 'ms')
    t.is(countTimers(), 0)
  }, 50)

  t.is(countTimers(), 1)
})

test('setTimeout timer active', async function (t) {
  t.plan(2)

  const timer = timers.setTimeout(function () {
    t.absent(timer.active)
  }, 50)

  t.ok(timer.active)
})

test.solo('setTimeout refresh', async function (t) {
  t.plan(2)

  const started = Date.now()

  const timer = timers.setTimeout(function () {
    t.is(ticks, 6, 'was refreshed')
    t.ok(isAround(Date.now() - started, 200), 'timers took ' + Math.abs(Date.now() - started) + 'ms')
  }, 50)

  let ticks = 0

  const t2 = timers.setInterval(function () {
    timer.refresh()
    if (++ticks === 6) timers.clearInterval(t2)
  }, 25)
})

test('interrupt setTimeout with CPU overhead', async function (t) {
  t.plan(2)

  const started = Date.now()

  timers.setTimeout(function () {
    t.ok(isAround(Date.now() - started, 75), 'timers took ' + Math.abs(Date.now() - started) + 'ms')
    t.is(countTimers(), 0)
  }, 50)

  while (Date.now() - started < 75) {} // eslint-disable-line no-empty
})

test('interrupt setTimeout with Atomics.wait', async function (t) {
  t.plan(2)

  const started = Date.now()

  timers.setTimeout(function () {
    t.ok(isAround(Date.now() - started, 75), 'timers took ' + Math.abs(Date.now() - started) + 'ms')
    t.is(countTimers(), 0)
  }, 50)

  sleep(75)
})

test('multiple setTimeout', async function (t) {
  t.plan(10)

  const started = Date.now()

  t.is(countTimers(), 0)

  timers.setTimeout(function () {
    t.ok(isAround(Date.now() - started, 20), '1st timer took ' + Math.abs(Date.now() - started) + 'ms')
  }, 20)

  t.is(countTimers(), 1)

  timers.setTimeout(function () {
    t.ok(isAround(Date.now() - started, 50), '2nd timer took ' + Math.abs(Date.now() - started) + 'ms')
    t.is(countTimers(), 0)
  }, 50)

  t.is(countTimers(), 2)

  timers.setTimeout(function () {
    t.ok(isAround(Date.now() - started, 20), '3rd timer took ' + Math.abs(Date.now() - started) + 'ms')
  }, 20)

  t.is(countTimers(), 3)

  timers.setTimeout(() => {
    t.ok(isAround(Date.now() - started, 0), '4th timer took ' + Math.abs(Date.now() - started) + 'ms')
  }, 1)

  t.is(countTimers(), 4)
})

test('clearTimeout', async function (t) {
  t.plan(2)

  const id = timers.setTimeout(() => t.fail('timeout should not be called'), 20)

  t.is(countTimers(), 1)
  timers.clearTimeout(id)
  t.is(countTimers(), 0)
})

test('clearTimeout afterwards', async function (t) {
  t.plan(4)

  const id = timers.setTimeout(() => t.fail('timeout should not be called'), 20)

  timers.setTimeout(() => {
    t.is(countTimers(), 2)
    timers.clearTimeout(id)
    t.is(countTimers(), 1)
  }, 15)

  timers.setTimeout(() => {
    t.pass()
    t.is(countTimers(), 0)
  }, 50)
})

test('clearTimeout twice', async function (t) {
  t.plan(3)

  const id = timers.setTimeout(() => t.fail('timeout should not be called'), 20)

  t.is(countTimers(), 1)
  timers.clearTimeout(id)
  t.is(countTimers(), 0)
  timers.clearTimeout(id)
  t.is(countTimers(), 0)
})

test('lots of setTimeout + clearTimeout', async function (t) {
  t.plan(2)

  const timeouts = new Array(2000000)
  let pass = 0

  for (let i = 0; i < timeouts.length; i++) {
    timeouts[i] = timers.setTimeout(ontimeout, 10)
    if (i % 2 === 0) timers.clearTimeout(timeouts[i])
  }

  function ontimeout () {
    if (++pass === timeouts.length / 2) {
      t.pass()
      t.is(countTimers(), 0)
    }
  }
})

test('error inside of setTimeout', async function (t) {
  t.plan(7)

  const error = new Error('random')

  timers.setTimeout(function () {
    t.pass()
    throw error
  }, 5)

  timers.setTimeout(() => t.pass(), 10)
  timers.setImmediate(() => t.pass())

  process.once('uncaughtException', function (err) {
    t.is(err, error)

    timers.setTimeout(() => {
      t.pass()
      t.is(countTimers(), 0)
    }, 20)

    timers.setImmediate(() => t.pass())
  })
})

test('setTimeout with big delay', async function (t) {
  t.plan(2)

  try {
    timers.setTimeout(function () {}, 0x7fffffff + 1)
    t.fail('should have failed to set a timeout')
  } catch (error) {
    t.is(error.code, 'ERR_INVALID_DELAY')
  }

  t.is(countTimers(), 0)
})

test('setTimeout with zero delay', async function (t) {
  t.plan(2)

  const started = Date.now()

  timers.setTimeout(function () {
    t.ok(isAround(Date.now() - started, 0), 'timers took ' + Math.abs(Date.now() - started) + 'ms')
    t.is(countTimers(), 0)
  }, 0)
})

test('setTimeout with negative delay', async function (t) {
  t.plan(2)

  try {
    timers.setTimeout(function () {}, -50)
    t.fail('should have failed to set a timeout')
  } catch (error) {
    t.is(error.code, 'ERR_INVALID_DELAY')
  }

  t.is(countTimers(), 0)
})

test('setTimeout with an invalid callback', async function (t) {
  t.plan(4)

  try {
    timers.setTimeout()
    t.fail('should have failed to set a timeout')
  } catch (error) {
    t.is(error.code, 'ERR_INVALID_CALLBACK')
  }

  try {
    timers.setTimeout(null)
    t.fail('should have failed to set a timeout')
  } catch (error) {
    t.is(error.code, 'ERR_INVALID_CALLBACK')
  }

  try {
    timers.setTimeout(true)
    t.fail('should have failed to set a timeout')
  } catch (error) {
    t.is(error.code, 'ERR_INVALID_CALLBACK')
  }

  t.is(countTimers(), 0)
})

test('setTimeout with a string number as delay', async function (t) {
  t.plan(2)

  const started = Date.now()

  timers.setTimeout(function () {
    t.ok(isAround(Date.now() - started, 25), 'timers took ' + Math.abs(Date.now() - started) + 'ms')
    t.is(countTimers(), 0)
  }, '25')
})

test('setTimeout with a string number plus a character as delay', async function (t) {
  t.plan(2)

  try {
    timers.setTimeout(function () {}, '100a')
  } catch (error) {
    t.is(error.code, 'ERR_INVALID_DELAY')
  }

  t.is(countTimers(), 0)
})

test('setTimeout with an invalid string as delay', async function (t) {
  t.plan(2)

  try {
    timers.setTimeout(function () {}, 'abcd')
  } catch (error) {
    t.is(error.code, 'ERR_INVALID_DELAY')
  }

  t.is(countTimers(), 0)
})
