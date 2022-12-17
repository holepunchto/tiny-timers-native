const nil = new Int32Array(new SharedArrayBuffer(4))

module.exports = { isAround, sleep }

function isAround (actual, expected) {
  if (!(actual >= expected)) return false
  if (process.env.CI) return true // GitHub CI machines are slow
  return (actual - expected) <= 5
}

function sleep (ms) {
  Atomics.wait(nil, 0, 0, ms)
}
