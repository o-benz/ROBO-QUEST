echo "source /opt/ros/humble/setup.bash" >> ~/.bashrc 
echo "source ~/limo_ws/install/setup.bash" >> ~/.bashrc 
echo "export ROS_DOMAIN_ID=107" >> ~/.bashrc
echo "export ROBOT=robot_2" >> ~/.bashrc
echo "chmod 666 /dev/ttyTHS1" >> ~/.bashrc
cd ~/limo_ws/src/limo_ros2
sudo rosdep init 
sudo rosdep update
sudo apt-get update -y
sudo apt install -y ros-humble-rosbridge-server
ros2 launch limo_bringup limo_start.launch.py