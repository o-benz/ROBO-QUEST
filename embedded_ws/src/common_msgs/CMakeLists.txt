cmake_minimum_required(VERSION 3.8)
project(common_msgs)

include_directories(
  ${ament_INCLUDE_DIRS}
  ${std_msgs_INCLUDE_DIRS}
)

if(CMAKE_COMPILER_IS_GNUCXX OR CMAKE_CXX_COMPILER_ID MATCHES "Clang")
  add_compile_options(-Wall -Wextra -Wpedantic)
endif()

# find dependencies
find_package(ament_cmake REQUIRED)
find_package(std_msgs REQUIRED)
find_package(action_msgs REQUIRED)
find_package(geometry_msgs REQUIRED)
find_package(rosidl_default_generators REQUIRED)

rosidl_generate_interfaces(${PROJECT_NAME}
  "msg/MissionDetails.msg"
  "msg/Position.msg"
  "msg/StartMission.msg"
  "msg/StopMission.msg"
  "msg/IdentifyRobot.msg"
  "action/Mission.action"
  "msg/MissionStatus.msg"
  "msg/LogMessage.msg"
  "msg/GeofenceBounds.msg"
  "msg/ReturnBase.msg"
  "msg/UpdateControllerCode.msg"
  "msg/P2P.msg"
  "msg/PoseWithDistance.msg"
  DEPENDENCIES std_msgs
  DEPENDENCIES action_msgs
  DEPENDENCIES geometry_msgs
)

if(BUILD_TESTING)
  find_package(ament_lint_auto REQUIRED)
  # the following line skips the linter which checks for copyrights
  # comment the line when a copyright and license is added to all source files
  set(ament_cmake_copyright_FOUND TRUE)
  # the following line skips cpplint (only works in a git repo)
  # comment the line when this package is in a git repo and when
  # a copyright and license is added to all source files
  set(ament_cmake_cpplint_FOUND TRUE)
  ament_lint_auto_find_test_dependencies()
endif()

ament_package()
