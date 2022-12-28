#include <napi-macros.h>
#include <node_api.h>
#include <uv.h>

typedef struct {
  uv_timer_t timer;
  napi_ref on_timeout;
  napi_env env;
  int32_t next_delay;
} tiny_timers_t;

static void
on_timer (uv_timer_t *handle) {
  tiny_timers_t *self = (tiny_timers_t *) handle;

  napi_handle_scope scope;
  napi_open_handle_scope(self->env, &scope);

  napi_value ctx;
  napi_get_global(self->env, &ctx);

  napi_value callback;
  napi_get_reference_value(self->env, self->on_timeout, &callback);

  self->next_delay = -1; // reset delay

  if (napi_make_callback(self->env, NULL, ctx, callback, 0, NULL, NULL) == napi_pending_exception) {
    napi_value fatal_exception;
    napi_get_and_clear_last_exception(self->env, &fatal_exception);
    napi_fatal_exception(self->env, fatal_exception);
  }

  if (self->next_delay > -1) {
    uv_timer_start(handle, on_timer, self->next_delay, 0);
  }

  napi_close_handle_scope(self->env, scope);
}

NAPI_METHOD(tiny_timer_init) {
  NAPI_ARGV(2)
  NAPI_ARGV_BUFFER_CAST(tiny_timers_t *, self, 0)

  self->env = env;
  self->next_delay = -1;

  uv_loop_t *loop;
  napi_get_uv_event_loop(env, &loop);

  uv_timer_init(loop, (uv_timer_t *) self);
  uv_unref((uv_handle_t *) self);

  napi_create_reference(env, argv[1], 1, &(self->on_timeout));

  return NULL;
}

NAPI_METHOD(tiny_timer_pause) {
  NAPI_ARGV(1)
  NAPI_ARGV_BUFFER_CAST(tiny_timers_t *, self, 0)

  uv_unref((uv_handle_t *) self);
  uv_timer_stop((uv_timer_t *) self);
  napi_delete_reference(env, self->on_timeout);

  return NULL;
}

NAPI_METHOD(tiny_timer_resume) {
  NAPI_ARGV(4)
  NAPI_ARGV_BUFFER_CAST(tiny_timers_t *, self, 0)
  NAPI_ARGV_INT32(ms, 1)
  NAPI_ARGV_UINT32(ref, 2)

  if (ref > 0) uv_ref((uv_handle_t *) self);
  napi_create_reference(env, argv[3], 1, &(self->on_timeout));
  self->next_delay = 0;
  uv_timer_start((uv_timer_t *) self, on_timer, ms, 0);

  return NULL;
}

NAPI_METHOD(tiny_timer_ref) {
  NAPI_ARGV(1)
  NAPI_ARGV_BUFFER_CAST(tiny_timers_t *, self, 0)

  uv_ref((uv_handle_t *) self);

  return NULL;
}

NAPI_METHOD(tiny_timer_unref) {
  NAPI_ARGV(1)
  NAPI_ARGV_BUFFER_CAST(tiny_timers_t *, self, 0)

  uv_unref((uv_handle_t *) self);

  return NULL;
}

NAPI_METHOD(tiny_timer_start) {
  NAPI_ARGV(2)
  NAPI_ARGV_BUFFER_CAST(tiny_timers_t *, self, 0)
  NAPI_ARGV_INT32(ms, 1)

  uv_timer_start((uv_timer_t *) self, on_timer, ms, 0);

  return NULL;
}

NAPI_INIT() {
  NAPI_EXPORT_SIZEOF(tiny_timers_t)
  NAPI_EXPORT_OFFSETOF(tiny_timers_t, next_delay)
  NAPI_EXPORT_FUNCTION(tiny_timer_init)
  NAPI_EXPORT_FUNCTION(tiny_timer_ref)
  NAPI_EXPORT_FUNCTION(tiny_timer_unref)
  NAPI_EXPORT_FUNCTION(tiny_timer_start)
  NAPI_EXPORT_FUNCTION(tiny_timer_pause)
  NAPI_EXPORT_FUNCTION(tiny_timer_resume)
}
