sudo chown nvidia:nvidia /dev/ttyTHS1 &&
cd ~/geppetto/embedded_ws&& source install/setup.bash &&
ros2 launch limo_bringup limo_start.launch.py &
cd ~/ros2_ws && source install/setup.bash && ros2 launch orbbec_camera dabai.launch.py &
cd ~/geppetto/embedded_ws && source install/setup.bash && ros2 run com_bridge negative_elevation