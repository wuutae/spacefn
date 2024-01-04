# https://cmake.org/licensing/

cmake_minimum_required(VERSION 3.12)
project(spacefn_engine)

set(CMAKE_CXX_STANDARD 14)
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -static")

include_directories(${CMAKE_SOURCE_DIR}/src)

file(GLOB SOURCES "src/*.cpp")

add_executable(spacefn_engine ${SOURCES})
