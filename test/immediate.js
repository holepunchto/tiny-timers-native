const test = require('brittle')
const timers = require('../index.js')
const { isAround } = require('./helpers/index.js')

test('setImmediate', async function (t) {
  t.plan(1)

  const started = Date.now()
  // Note: this always print timers first, and native second

  timers.setImmediate(function () {
    t.ok(isAround(Date.now() - started, 0), 'timers took ' + Math.abs(Date.now() - started) + 'ms')
  })

  /* setImmediate(function () {
    t.ok(isAround(Date.now() - started, 0), 'native took ' + Math.abs(Date.now() - started) + 'ms')
  }) */
})

test('order of setImmediate', async function (t) {
  t.plan(1)

  let count = 0

  for (let i = 0; i < 1000000; i++) {
    timers.setImmediate(function () {
      if (count++ !== i) t.fail('order is incorrect (' + (count - 1) + '/' + i + ')')
      done()
    })
  }

  function done () {
    if (count === 1000000) t.pass()
  }
})

/* test.skip('setImmediate inside of a setImmediate', async function (t) {
  t.plan(1)

  let nativeImmediate = false

  timers.setImmediate(function () {
    timers.setImmediate(function () {

    })
  })

  setImmediate(function () {
    nativeImmediate = true
  })
}) */

test('setImmediate with an invalid callback', async function (t) {
  t.plan(3)

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
})
