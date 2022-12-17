const isLinux = process.platform === 'linux'
const nil = new Int32Array(new SharedArrayBuffer(4))

module.exports = { isAround, sleep }

function isAround (actual, expected) {
  if (isLinux && (actual - expected) > 5) return false
  return actual >= expected // GitHub CI machines are slow
}

function sleep (ms) {
  Atomics.wait(nil, 0, 0, ms)
}
