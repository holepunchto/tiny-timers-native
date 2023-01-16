cmake_minimum_required(VERSION 3.22)

project(tiny_timers_native C CXX)

execute_process(COMMAND pearjs-dev --require napi-macros --cwd ${CMAKE_CURRENT_SOURCE_DIR} OUTPUT_VARIABLE NAPI_MACROS_INCLUDE)
execute_process(COMMAND pearjs-dev --include OUTPUT_VARIABLE PEARJS_INCLUDE)

include_directories(
  tiny_timers_native
  PUBLIC
    "${PEARJS_INCLUDE}"
    "${NAPI_MACROS_INCLUDE}"
)

add_library(
  tiny_timers_native
  MODULE
    binding.c
)

if(APPLE)
  set_target_properties(
    tiny_timers_native
    PROPERTIES
      LINK_FLAGS "-undefined dynamic_lookup -Xlinker -no_fixup_chains"
  )
endif(APPLE)

set_target_properties(
  tiny_timers_native
  PROPERTIES
    PREFIX ""
    SUFFIX ".pear"
    C_STANDARD 99
    POSITION_INDEPENDENT_CODE 1
)
