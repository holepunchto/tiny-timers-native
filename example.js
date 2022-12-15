const timers = require('./')

timers.trace = true
timers.setImmediate(function () {
  console.log('hoto')
})

for (const t of timers) {
  console.log(t.stack)
}
// timers.setTimeout(function () {
//   console.log('hello world')
// }, 100)

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
