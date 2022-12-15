const timers = require('./')

timers.setTimeout(function () {
  console.log('hello world')
}, 100)

timers.setTimeout(function () {
  console.log('hello world')
}, 150)

timers.setTimeout(function () {
  console.log('hello world')
}, 200)
