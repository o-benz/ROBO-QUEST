# Embedded Workspace

## Table of Contents
- [Embedded Workspace](#embedded-workspace)
  - [Table of Contents](#table-of-contents)
  - [Description](#description)
  - [Installation](#installation)
  - [Usage](#usage)
  - [Packages](#packages)
    - [com\_bridge](#com_bridge)
    - [m-explore-ros2](#m-explore-ros2)
    - [common\_msgs](#common_msgs)
    - [examples\_msgs](#examples_msgs)
  - [License](#license)
  - [Authors](#authors)
  - [Acknowledgments](#acknowledgments)

## Description
This is the embedded workspace for the multi-robot exploration system. It contains the necessary packages and configurations to run the embedded components of the system, including communication bridges, exploration algorithms, and map merging functionalities.

## Installation
To set up the embedded workspace, follow these steps:

1. Clone the repository on the robot (only the embedded_ws is needed):
    ```sh
    git clone https://gitlab.com/polytechnique-montr-al/inf3995/20243/equipe-107/geppetto.git
    cd geppetto/embedded_ws
    ```

2. Install dependencies:
    ```sh
    rosdep install --from-paths src --ignore-src -r -y
    ```

3. Build the workspace:
    ```sh
    colcon build
    ```

4. Source the workspace:
    ```sh
    source install/setup.bash
    ```

## Usage
Connect the robot and your work station on the same network to ssh on the device.

To launch the embedded components, use the provided launch files on the robot. For example, to start the communication bridge and exploration nodes, run:
```sh
ros2 launch com_bridge com_bridge_launch.py
```

To launch all of the system do the following command in /robot_script :

    ```sh
    ./launch.sh
    ```
Read the same file to see all the commands needed to do it manually.

## Packages
### com_bridge
Manages communication between the server and physical robots. It includes nodes for mission control, robot identification, and mission status management.

### m-explore-ros2
Contains the ROS2 port for multi-robot autonomous exploration and map merging. It includes nodes for frontier-based exploration and map merging.

### common_msgs
Defines common message types used across the system, such as MissionStatus, LogMessage, and MissionDetails.

### examples_msgs
Contains example messages for testing and demonstration purposes.


## License
This project is licensed under the BSD License. See the LICENSE file for details.

## Authors
Ely Cheikh Abyss
Omar Benzekri
Abdul-Wahab Chaarani
Loïc Nguemegne
Thomas Rouleau
Ivan Samoylenko

## Acknowledgments
Special thanks to Antoine Robillard, Mark Bong, Guillaume Ricard, and Benjamin De Leener for their support and contributions.