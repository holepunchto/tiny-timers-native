const timers = require('./')

timers.setImmediate(function () {
  console.log('hoto')
})

timers.setTimeout(function () {
  console.log('hello world')
}, 100)

timers.setTimeout(function () {
  console.log('hello world')
}, 100)

timers.setTimeout(function () {
  console.log('hello world')
}, 100)

timers.setTimeout(function () {
  console.log('hello world')
}, 120)

timers.setTimeout(function () {
  console.log('hello world')
}, 110)

timers.setTimeout(function () {
  console.log('hello world')
}, 120)

timers.setTimeout(function () {
  console.log('hello world')
}, 120)

timers.setTimeout(function () {
  console.log('hello world 1')
}, 120)

timers.pause()

setTimeout(function () {
  timers.resume()
}, 1000)
// timers.setTimeout(function () {
//   console.log('hello world')
// }, 150)

// timers.setTimeout(function () {
//   console.log('hello world')
// }, 200)

// let inc = 0

// const i = timers.setInterval(function (n) {
//   console.log('yoyo', n, ++inc)

//   if (inc > 10) i.unref()
// }, 100, 'yo')
