const Heap = require('tiny-binary-heap')
const b4a = require('b4a')
const binding = require('./binding')

class Timer {
  constructor (list, expiry, repeat, fn, args) {
    this._list = list
    this._sync = ticks
    this._expiry = expiry
    this._repeat = repeat
    this._fn = fn
    this._args = args
    this._prev = this
    this._next = this
    this._refed = true

    this.stack = tracing ? new Error().stack : null

    incRef()
  }

  get active () {
    return this._prev !== this._next || (this._list !== null && this._list.tail === this)
  }

  _run (now) {
    if (this._repeat === true) {
      this._expiry = now + this._list.ms
      this._list.push(this)
    } else {
      if (this._refed === true) decRef()
      this._list = null
    }
    // apply at the bottom to avoid re-entries...
    this._fn.apply(null, this._args)
  }

  _clear () {
    if (this._list === null) return
    this._list.clear(this)
    if (this._refed === true) decRef()
    this._list = null

    maybeUpdateTimer()
  }

  refresh () {
    if (this._list === null) return
    this._list.clear(this)
    this._expiry = Date.now() + this._list.ms
    this._list.push(this)

    maybeUpdateTimer()
  }

  hasRef () {
    return this._refed
  }

  unref () {
    if (this._refed === false) return
    this._refed = false
    decRef()
  }

  ref () {
    if (this._refed === true) return
    this._refed = true
    incRef()
  }
}

class TimerList {
  constructor (ms) {
    this.ms = ms
    this.tail = null
    this.expiry = 0
  }

  queue (repeat, now, fn, args) {
    const expiry = now + this.ms
    const timer = new Timer(this, expiry, repeat, fn, args)
    return this.push(timer)
  }

  updateExpiry () {
    if (this.tail !== null) this.expiry = this.tail._expiry
  }

  push (timer) {
    if (this.tail === null) {
      this.tail = timer
      return timer
    }

    const head = this.tail._prev

    head._next = timer
    timer._prev = head

    timer._next = this.tail
    this.tail._prev = timer

    return timer
  }

  shift () {
    const tail = this.tail
    if (tail !== null) this.clear(tail)
    return tail
  }

  clear (timer) {
    const prev = timer._prev
    const next = timer._next

    timer._prev = timer._next = timer

    prev._next = next
    next._prev = prev

    if (timer === this.tail) {
      this.tail = next === timer ? null : next
    }
  }
}

const timers = new Map()
const queue = new Heap(cmp)
const immediates = new TimerList(0)
const handle = b4a.alloc(binding.sizeof_tiny_timers_t)
const view = new Int32Array(handle.buffer, handle.byteOffset + binding.offsetof_tiny_timers_t_next_delay, 1)

binding.tiny_timer_init(handle, ontimer)
process.once('exit', pause)

let refs = 0
let garbage = 0
let nextExpiry = 0
let ticks = 1
let triggered = 0
let paused = false
let tracing = false

function pause () {
  if (paused) return
  binding.tiny_timer_pause(handle)
  paused = true
}

function resume () {
  if (!paused) return
  binding.tiny_timer_resume(handle, Math.max(nextExpiry - Date.now(), 0), refs, ontimer)
  paused = false
}

function incRef () {
  if (refs++ === 0) binding.tiny_timer_ref(handle)
}

function decRef () {
  if (--refs === 0) binding.tiny_timer_unref(handle)
}

function trace (val) {
  tracing = !!val
}

function tick () {
  // just a wrapping number between 0-255 for checking re-entry and if we need
  // to wakeup the timer in c
  return (ticks = (ticks + 1) & 0xff)
}

function cancelTimer () {
  if (paused || ticks === triggered) return
  binding.tiny_timer_stop(handle)
}

function updateTimer (ms) {
  if (paused || ticks === triggered) return
  binding.tiny_timer_start(handle, ms)
}

function ontimer () {
  const now = Date.now()

  if (now < nextExpiry) {
    view[0] = (nextExpiry - now)
    return
  }

  let next
  let uncaughtError = null

  triggered = tick()

  while ((next = queue.peek()) !== undefined && next.expiry <= now && uncaughtError === null) {
    let ran = false

    // check if the next is expiring AND that it was not added immediately (ie setImmediate loop)
    while (next.tail !== null && next.tail._expiry <= now) {
      ran = true

      try {
        next.shift()._run(now)
      } catch (err) {
        uncaughtError = err
        break
      }
    }

    if (next.tail === null) {
      if (ran === false) garbage--
      deleteTimerList(next)
      queue.shift()
      next = undefined
    } else {
      next.updateExpiry()
      queue.update()
    }
  }

  while (immediates.tail !== null && immediates.tail._sync !== ticks && uncaughtError === null) {
    try {
      immediates.shift()._run(now)
    } catch (err) {
      uncaughtError = err
      break
    }
  }

  tick()

  if (garbage >= 8 && 2 * garbage >= queue.length) {
    // reset the heap if too much garbage exists...
    queue.filter(alive)
    garbage = 0
  }

  if (immediates.tail !== null) {
    view[0] = 0
    nextExpiry = now
  } else if (next !== undefined) {
    view[0] = Math.max(next.expiry - now, 0)
    nextExpiry = next.expiry
  } else {
    view[0] = -1
    nextExpiry = 0
  }

  if (uncaughtError !== null) {
    // retrigger asap, safest choice (and the user should have crashed anyway)
    view[0] = 0
    nextExpiry = now
    throw uncaughtError
  }
}

function maybeUpdateTimer () {
  if (ticks === triggered) return

  let updated = false

  while (queue.length > 0) {
    const first = queue.peek()

    if (first.tail === null) {
      updated = true
      queue.shift()
      garbage--
      deleteTimerList(first)
      continue
    }

    if (first.expiry !== first.tail._expiry) {
      updated = true
      first.updateExpiry()
      queue.update()
      continue
    }

    break
  }

  if (updated === false) return
  if (immediates.tail !== null) return

  if (queue.length === 0) {
    nextExpiry = 0
    cancelTimer()
    return
  }

  const exp = queue.peek().expiry
  if (exp !== nextExpiry) {
    nextExpiry = exp
  }
}

function deleteTimerList (list) {
  list.expiry = 0
  timers.delete(list.ms)
}

function queueTimer (ms, repeat, fn, args) {
  if (typeof fn !== 'function') throw typeError('Callback must be a function', 'ERR_INVALID_CALLBACK')
  if (ms === 0) ms = 1
  if (!(ms >= 1 && ms <= 0x7fffffff)) throw typeError('Invalid delay', 'ERR_INVALID_DELAY')

  const now = Date.now()

  let l = timers.get(ms)

  if (l) {
    if (l.tail === null) garbage--
    return l.queue(repeat, now, fn, args)
  }

  l = new TimerList(ms)
  timers.set(ms, l)

  const timer = l.queue(repeat, now, fn, args)

  l.updateExpiry()
  queue.push(l)

  if (l.expiry < nextExpiry || nextExpiry === 0) {
    nextExpiry = l.expiry
    updateTimer(l.ms)
  }

  return timer
}

function clearTimer (timer) {
  const list = timer._list
  timer._clear()
  if (list.tail !== null || list.expiry === 0) return // anything with expiry 0, is not referenced...
  garbage++
}

function setTimeout (fn, ms, ...args) {
  return queueTimer(Math.floor(ms), false, fn, [...args])
}

function clearTimeout (timer) {
  if (timer && timer._list !== null) clearTimer(timer)
}

function setInterval (fn, ms, ...args) {
  return queueTimer(Math.floor(ms), true, fn, [...args])
}

function clearInterval (timer) {
  if (timer && timer._list !== null) clearTimer(timer)
}

function setImmediate (fn, ...args) {
  if (typeof fn !== 'function') throw typeError('Callback must be a function', 'ERR_INVALID_CALLBACK')

  const now = Date.now()
  const timer = immediates.queue(false, now, fn, args)

  if (now < nextExpiry || nextExpiry === 0) {
    nextExpiry = now
    updateTimer(0)
  }

  return timer
}

function clearImmediate (timer) {
  if (timer && timer._list !== null) clearTimer(timer)
}

function cmp (a, b) {
  const diff = a.expiry - b.expiry
  return diff === 0 ? a.ms - b.ms : diff
}

function alive (list) {
  if (list.tail === null) {
    deleteTimerList(list)
    return false
  }
  return true
}

function typeError (message, code) {
  const error = new TypeError(message)
  error.code = code
  return error
}

module.exports = {
  trace,
  handle,
  ontimer,
  pause,
  resume,
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  setImmediate,
  clearImmediate,
  * [Symbol.iterator] () {
    if (immediates.tail !== null) {
      yield immediates.tail
      for (let t = immediates.tail._next; t !== immediates.tail; t = t._next) yield t
    }
    for (const list of timers.values()) {
      if (list.tail === null) continue
      yield list.tail
      for (let t = list.tail._next; t !== list.tail; t = t._next) yield t
    }
  }
}
