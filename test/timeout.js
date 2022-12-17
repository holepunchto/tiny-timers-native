const test = require('brittle')
const timers = require('../index.js')
const { isAround, sleep } = require('./helpers/index.js')

test('setTimeout', async function (t) {
  t.plan(1)

  const started = Date.now()

  timers.setTimeout(function () {
    t.ok(isAround(Date.now() - started, 50), 'timers took ' + Math.abs(Date.now() - started) + 'ms')
  }, 50)
})

test('interrupt setTimeout with CPU overhead', async function (t) {
  t.plan(1)

  const started = Date.now()

  timers.setTimeout(function () {
    t.ok(isAround(Date.now() - started, 75), 'timers took ' + Math.abs(Date.now() - started) + 'ms')
  }, 50)

  while (Date.now() - started < 75) {} // eslint-disable-line no-empty
})

test('interrupt setTimeout with Atomics.wait', async function (t) {
  t.plan(1)

  const started = Date.now()

  timers.setTimeout(function () {
    t.ok(isAround(Date.now() - started, 75), 'timers took ' + Math.abs(Date.now() - started) + 'ms')
  }, 50)

  sleep(75)
})

test('multiple setTimeout', async function (t) {
  t.plan(4)

  const started = Date.now()

  timers.setTimeout(function () {
    t.ok(isAround(Date.now() - started, 20), '1st timer took ' + Math.abs(Date.now() - started) + 'ms')
  }, 20)

  timers.setTimeout(function () {
    t.ok(isAround(Date.now() - started, 50), '2nd timer took ' + Math.abs(Date.now() - started) + 'ms')
  }, 50)

  timers.setTimeout(function () {
    t.ok(isAround(Date.now() - started, 20), '3rd timer took ' + Math.abs(Date.now() - started) + 'ms')
  }, 20)

  timers.setTimeout(() => {
    t.ok(isAround(Date.now() - started, 0), '4th timer took ' + Math.abs(Date.now() - started) + 'ms')
  }, 1)
})

test('clearTimeout', async function (t) {
  t.plan(1)

  const id = timers.setTimeout(() => t.fail('timeout should not be called'), 20)
  timers.setTimeout(() => timers.clearTimeout(id), 15)
  timers.setTimeout(() => t.pass(), 50)
})

test('clearTimeout twice', async function (t) {
  t.plan(1)

  const id = timers.setTimeout(() => t.fail('timeout should not be called'), 20)

  timers.setTimeout(() => {
    timers.clearTimeout(id)
    timers.clearTimeout(id)
  }, 15)

  timers.setTimeout(() => t.pass(), 50)
})

test('lots of setTimeout + clearTimeout', async function (t) {
  t.plan(1)

  const timeouts = new Array(2000000)
  let pass = 0

  for (let i = 0; i < timeouts.length; i++) {
    timeouts[i] = timers.setTimeout(ontimeout, 10)
    if (i % 2 === 0) timers.clearTimeout(timeouts[i])
  }

  function ontimeout () {
    if (++pass === timeouts.length / 2) {
      t.pass()
    }
  }
})

test('error inside of setTimeout', async function (t) {
  t.plan(2)

  const error = new Error('random')

  timers.setTimeout(function () {
    t.pass()
    throw error
  }, 10)

  process.once('uncaughtException', function (err) {
    t.is(err, error)
  })
})

test('setTimeout with big delay', async function (t) {
  t.plan(1)

  try {
    timers.setTimeout(function () {}, 0x7fffffff + 1)
    t.fail('should have failed to set a timeout')
  } catch (error) {
    t.is(error.message, 'Invalid interval')
  }
})

test('setTimeout with zero delay', async function (t) {
  t.plan(1)

  const started = Date.now()

  timers.setTimeout(function () {
    t.ok(isAround(Date.now() - started, 0), 'timers took ' + Math.abs(Date.now() - started) + 'ms')
  }, 0)
})

test('setTimeout with negative delay', async function (t) {
  t.plan(1)

  try {
    timers.setTimeout(function () {}, -50)
    t.fail('should have failed to set a timeout')
  } catch (error) {
    t.is(error.message, 'Invalid interval')
  }
})

test('setTimeout with an invalid callback', async function (t) {
  t.plan(3)

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
})

test('setTimeout with a string number as delay', async function (t) {
  t.plan(1)

  const started = Date.now()

  timers.setTimeout(function () {
    t.ok(isAround(Date.now() - started, 25), 'timers took ' + Math.abs(Date.now() - started) + 'ms')
  }, '25')
})

/* test.solo('setTimeout with a string number plus a character as delay', async function (t) {
  t.plan(2)

  const started = Date.now()

  timers.setTimeout(function () {
    t.ok(isAround(Date.now() - started, 50), 'timers took ' + Math.abs(Date.now() - started) + 'ms')
  }, '100a') // + currently it takes 1ms

  setTimeout(function () {
    t.ok(isAround(Date.now() - started, 50), 'native took ' + Math.abs(Date.now() - started) + 'ms')
  }, '100a') // + currently it takes 5ms, why? lol
}) */

test('setTimeout with an invalid string as delay', async function (t) {
  t.plan(1)

  try {
    timers.setTimeout(function () {}, 'abcd')
  } catch (error) {
    t.is(error.message, 'Invalid interval')
  }
})
