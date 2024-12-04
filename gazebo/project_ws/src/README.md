# ros_gz_project_template
A template project integrating ROS 2 and Gazebo simulator.

## Included packages

* `ros_gz_example_description` - holds the sdf description of the simulated system and any other assets.

* `ros_gz_example_gazebo` - holds gazebo specific code and configurations. Namely this is where systems end up.

* `ros_gz_example_application` - holds ros2 specific code and configurations.

* `ros_gz_example_bringup` - holds launch files and high level utilities.

## Usage

1. Install dependencies

    ```bash
    rosdep init
    rosdep update
    rosdep install --from-paths src --ignore-src -r -i -y
    ```

2. Build the project 
    ```bash
    colcon build --cmake-args -DBUILD_TESTING=ON
    ```
you might also want to look into using the `--symlink-install` flag to make modification to python and config files easier

3. Source the workspace

    ```bash
    source install/setup.sh
    ```

4. Launch the simulation

    ```bash
    ros2 launch ros_gz_example_bringup diff_drive.launch.py
    ```

For a more detailed guide on using this template see [documentation](https://gazebosim.org/docs/latest/ros_gz_project_template_guide).
