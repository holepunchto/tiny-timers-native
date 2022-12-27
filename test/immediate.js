const test = require('brittle')
const timers = require('../index.js')
const { isAround, countTimers } = require('./helpers/index.js')

test('setImmediate', async function (t) {
  t.plan(4)

  const started = Date.now()

  t.is(countTimers(), 0)

  timers.setImmediate(function () {
    t.ok(isAround(Date.now() - started, 0), 'timers took ' + Math.abs(Date.now() - started) + 'ms')
    t.is(countTimers(), 0)
  })

  t.is(countTimers(), 1)
})

test('setImmediate timer active', async function (t) {
  t.plan(2)

  const timer = timers.setImmediate(function () {
    t.absent(timer.active)
  }, 50)

  t.ok(timer.active)
})

test('clearImmediate', async function (t) {
  t.plan(2)

  const id = timers.setImmediate(() => t.fail('immediate should not be called'))

  t.is(countTimers(), 1)
  timers.clearImmediate(id)
  t.is(countTimers(), 0)
})

test('clearImmediate afterwards', async function (t) {
  t.plan(2)

  let id = null

  timers.setImmediate(() => {
    t.is(countTimers(), 1)
    timers.clearImmediate(id)
    t.is(countTimers(), 0)
  })

  id = timers.setImmediate(() => t.fail('timeout should not be called'))
})

test('clearImmediate twice', async function (t) {
  t.plan(3)

  const id = timers.setImmediate(() => t.fail('timeout should not be called'))

  t.is(countTimers(), 1)
  timers.clearImmediate(id)
  t.is(countTimers(), 0)
  timers.clearImmediate(id)
  t.is(countTimers(), 0)
})

test('order of setImmediate', async function (t) {
  t.plan(2)

  let count = 0

  for (let i = 0; i < 1000000; i++) {
    timers.setImmediate(function () {
      if (count++ !== i) t.fail('order is incorrect (' + (count - 1) + '/' + i + ')')
      done()
    })
  }

  function done () {
    if (count === 1000000) {
      t.pass()
      t.is(countTimers(), 0)
    }
  }
})

test('error inside of setImmediate', async function (t) {
  t.plan(7)

  const error = new Error('random')

  timers.setImmediate(function () {
    t.pass()
    throw error
  })

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

test('setImmediate with an invalid callback', async function (t) {
  t.plan(4)

  try {
    timers.setImmediate()
    t.fail('should have failed to set an immediate')
  } catch (error) {
    t.is(error.code, 'ERR_INVALID_CALLBACK')
  }

  try {
    timers.setImmediate(null)
    t.fail('should have failed to set an immediate')
  } catch (error) {
    t.is(error.code, 'ERR_INVALID_CALLBACK')
  }

  try {
    timers.setImmediate(true)
    t.fail('should have failed to set an immediate')
  } catch (error) {
    t.is(error.code, 'ERR_INVALID_CALLBACK')
  }

  t.is(countTimers(), 0)
})
