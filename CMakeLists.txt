cmake_minimum_required(VERSION 3.25)

project(tiny_timers_native C)

include(pear)

add_pear_module(tiny_timers_native)

target_sources(
  tiny_timers_native
  PRIVATE
    binding.c
)
