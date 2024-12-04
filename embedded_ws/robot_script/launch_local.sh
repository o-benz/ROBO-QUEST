echo "EN ATTENTE" >/tmp/.mission_status
AUDIO_DEVICE_ID=$(pactl list short sinks | grep "USB_PnP_Audio_Device" | awk '{print $1}')
pactl set-default-sink $AUDIO_DEVICE_ID
sudo chown nvidia:nvidia /dev/ttyTHS1 &&
cd ~/geppetto/embedded_ws && colcon build && source install/setup.bash
ros2 launch limo_bringup limo_start.launch.py &
sleep 2
ros2 launch slam_toolbox online_async_launch.py slam_params_file:=mapper_params_online_async.yaml &
ros2 launch limo_bringup navigation2.launch.py &
sleep 2
ros2 launch com_bridge com_bridge_launch.py &
sleep 1
ros2 launch multirobot_map_merge map_merge.launch.py &
sleep 2
ros2 run rosbridge_server rosbridge_websocket &
sleep 2
ros2 launch explore_lite explore.launch.py &
sleep 1
ros2 topic pub /explore/resume std_msgs/msg/Bool "{data: false}" --once 



