Manual Launch of Gazebo simulation and it's services

1. Build embedded_ws
   1. source /opt/ros/humble/setup.bash; pip uninstall em; pip uninstall empy -y; pip install empy; colcon build --packages-skip limo_base ydlidar_ros2_driver voice_control; source install/setup.bash
   2. echo "EN ATTENTE" > /tmp/.mission_status

2. Build and launch Gazebo
   1. source /opt/ros/humble/setup.bash && rosdep update    && sudo apt-get update -y    && rosdep install --from-paths src --ignore-src -r -i -y    && sudo apt install -y ros-humble-rosbridge-server    && colcon build --cmake-args -DBUILD_TESTING=ON
   2. source ../../embedded_ws/install/setup.bash && source /opt/ros/humble/setup.bash && source install/setup.bash && ros2 launch ros_gz_example_bringup diff_drive.launch.py

3. Launch needed nodes and services
   1. ros2 launch ros_gz_example_bringup slam_toolbox.py
   2. ros2 launch ros_gz_example_bringup map_merge.launch.py
   3. ros2 run rviz2 rviz2 -d /opt/ros/humble/share/nav2_bringup/rviz/nav2_default_view.rviz
   4. source /opt/ros/humble/setup.bash && source install/setup.bash && sleep 10 && ros2 launch ros_gz_example_bringup navigation.launch.py
   5. source /opt/ros/humble/setup.bash && source install/setup.bash && sleep 10 && ros2 launch ros_gz_example_bringup navigation.launch2.py
   6. source /opt/ros/humble/setup.bash && source ../../embedded_ws/install/setup.bash && ros2 launch ros_gz_example_bringup explore.launch.py
   7. source /opt/ros/humble/setup.bash && source ../../embedded_ws/install/setup.bash && ros2 launch ros_gz_example_bringup explore.launch2.py
   8. source /opt/ros/humble/setup.bash && source ../../embedded_ws/install/setup.bash && ros2 topic pub /limo1/explore/resume std_msgs/msg/Bool "{data: false}" --once
   9. source /opt/ros/humble/setup.bash && source ../../embedded_ws/install/setup.bash && ros2 topic pub /limo2/explore/resume std_msgs/msg/Bool "{data: false}" --once
   10. colcon build --packages-select common_msgs && source ../../embedded_ws/install/setup.bash && ros2 run rosbridge_server rosbridge_websocket