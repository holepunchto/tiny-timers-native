const nil = new Int32Array(new SharedArrayBuffer(4))
console.log('process.env.CI:', process.env.CI)

module.exports = { isAround, sleep }

function isAround (actual, expected) {
  if (process.env.CI) return actual >= expected // GitHub CI machines are slow
  return (actual - expected) <= 5
}

function sleep (ms) {
  Atomics.wait(nil, 0, 0, ms)
}
