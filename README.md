
## Name
This is the official readme for the ROBO-QUEST project

## Description
The purpose of this project is to develop a proof of concept for planetary exploration using a multi-robot system, equipped with the minimum sensors required by the Canadian Space Agency (CSA). This project, focused on research and education in space exploration, aims to demonstrate the effectiveness and viability of a simple autonomous multi-robot system in a controlled indoor environment simulating planetary exploration conditions. The robots can autonomously explore an unknown area, roughly the size of a room, using only the sensors specified by the CSA: an IMU ("Inertial Measurement Unit"), a 3D camera, an RGB camera, and a LiDAR ("Light Detection and Ranging"). The operator is able to monitor the data in real-time via a web interface, with limited control over starting and stopping the operations. The system will generate an accurate map of the explored area.

The project uses Docker to simplify the management of services, dependencies, and deployment. The three non-embedded services (Client: Angular front-end application, Server: NestJS back-end API, and Gazebo: simulation environment) are configured in the compose.yaml file for simultaneous launch. This approach centralizes the construction and startup of services, with the option to launch each service independently.

You can find the necessary information for installing Docker in their official documentation and the required modifications for granting the correct permissions in their post-installation steps documentation.

To start the system, execute the following command in the launch directory:
```sh
./start.sh
```
This command performs two actions: it retrieves the computer's IP address to allow network users to connect to the server launched in a Docker container and executes docker-compose to build the necessary containers for the client, server, and simulation. Once launched, the server is accessible at http://localhost:3000/ and the user interface at http://localhost:4200/. The Gazebo simulation starts at the same time, and an exploration is ready to be launched.

## Usage
Before launching a mission, ensure that the robots are properly connected. If not, connect them by pressing "Robot 1" and "Robot 2" and verify that the simulation is started. Then, click the "Start Mission" button to begin exploration by selecting between simulation mode and physical mode. Use the "End Mission" button to stop the robots. You can access mission logs from the "Logs History" section in the header.

For additional information on usage read the DocumentationDuProjet-107-offre-CDR document

## Coding guidelines
For Javascript and Typescript, the [Airbnb Standards](https://github.com/airbnb/javascript) have been used along with the [default prettier options](https://prettier.io/docs/en/options.html).

For Python, the [Google coding guidlines](https://google.github.io/styleguide/pyguide.html) have been chosen.

The branch and commits naming best practices have been taken from
[this blog](https://medium.com/@shinjithkanhangad/git-good-best-practices-for-branch-naming-and-commit-messages-a903b9f08d68).

## Authors and acknowledgment
Project Authors: Ely Cheikh Abyss, Omar Benzekri, Abdul-Wahab Chaarani, Loïc Nguemegne, Thomas Rouleau and Ivan Samoylenko



