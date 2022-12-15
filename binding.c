#include <napi-macros.h>
#include <node_api.h>
#include <uv.h>

static napi_ref on_timeout;
static napi_env on_timeout_env;

static void
on_timer (uv_timer_t *handle) {
  napi_handle_scope scope;
  napi_open_handle_scope(on_timeout_env, &scope);

  napi_value ctx;
  napi_get_global(on_timeout_env, &ctx);

  napi_value callback;
  napi_get_reference_value(on_timeout_env, on_timeout, &callback);

  if (napi_make_callback(on_timeout_env, NULL, ctx, callback, 0, NULL, NULL) == napi_pending_exception) {
    napi_value fatal_exception;
    napi_get_and_clear_last_exception(on_timeout_env, &fatal_exception);
    napi_fatal_exception(on_timeout_env, fatal_exception);
  }

  napi_close_handle_scope(on_timeout_env, scope);
}

NAPI_METHOD(tiny_timer_init) {
  NAPI_ARGV(2)
  NAPI_ARGV_BUFFER_CAST(uv_timer_t *, handle, 0)

  on_timeout_env = env;

  uv_loop_t *loop;
  napi_get_uv_event_loop(env, &loop);

  uv_timer_init(loop, handle);
  uv_unref((uv_handle_t *) handle);

  napi_create_reference(env, argv[1], 1, &on_timeout);

  return NULL;
}

NAPI_METHOD(tiny_timer_pause) {
  NAPI_ARGV(1)
  NAPI_ARGV_BUFFER_CAST(uv_timer_t *, handle, 0)

  uv_timer_stop(handle);
  napi_delete_reference(env, on_timeout);

  return NULL;
}

NAPI_METHOD(tiny_timer_resume) {
  NAPI_ARGV(3)
  NAPI_ARGV_BUFFER_CAST(uv_timer_t *, handle, 0)
  NAPI_ARGV_UINT32(ms, 1)

  uv_ref((uv_handle_t *) handle);
  napi_create_reference(env, argv[2], 1, &on_timeout);
  uv_timer_start(handle, on_timer, ms, 0);

  return NULL;
}

NAPI_METHOD(tiny_timer_ref) {
  NAPI_ARGV(1)
  NAPI_ARGV_BUFFER_CAST(uv_timer_t *, handle, 0)

  uv_ref((uv_handle_t *) handle);

  return NULL;
}

NAPI_METHOD(tiny_timer_unref) {
  NAPI_ARGV(1)
  NAPI_ARGV_BUFFER_CAST(uv_timer_t *, handle, 0)

  uv_unref((uv_handle_t *) handle);

  return NULL;
}

NAPI_METHOD(tiny_timer_start) {
  NAPI_ARGV(2)
  NAPI_ARGV_BUFFER_CAST(uv_timer_t *, handle, 0)
  NAPI_ARGV_UINT32(ms, 1)

  uv_timer_start(handle, on_timer, ms, 0);

  return NULL;
}

NAPI_INIT() {
  NAPI_EXPORT_SIZEOF(uv_timer_t)
  NAPI_EXPORT_FUNCTION(tiny_timer_init)
  NAPI_EXPORT_FUNCTION(tiny_timer_ref)
  NAPI_EXPORT_FUNCTION(tiny_timer_unref)
  NAPI_EXPORT_FUNCTION(tiny_timer_start)
  NAPI_EXPORT_FUNCTION(tiny_timer_pause)
  NAPI_EXPORT_FUNCTION(tiny_timer_resume)
}
