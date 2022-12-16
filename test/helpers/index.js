module.exports = { isAround, sleep }

function isAround (actual, expected, precision = 5) {
  const diff = Math.abs(actual - expected)
  return diff <= precision
}

function sleep (ms) {
  if (!this.nil) this.nil = new Int32Array(new SharedArrayBuffer(4))
  Atomics.wait(this.nil, 0, 0, ms)
}
