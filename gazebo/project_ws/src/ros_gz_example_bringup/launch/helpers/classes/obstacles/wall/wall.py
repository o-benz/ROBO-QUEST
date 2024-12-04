import os
import sys
import random
from .wall_type import Wall_Type
from ..obstacle import Obstacle
from ...core.pose import Pose
from ...core.size import Size
from ...core.scale import Scale
from ament_index_python.packages import get_package_share_directory

# import helpers directory
current_dir = os.path.dirname(__file__)
sys.path.append(current_dir)

helpers_dir = os.path.join(
    get_package_share_directory("ros_gz_example_bringup"),
    "helpers",
)
sys.path.append(helpers_dir)

from helpers.config import *
from helpers.classes.core.direction import Direction


class Wall(Obstacle):
    real_world_size_x = 3
    real_world_size_y = 0.1

    def __init__(
        self,
        pose: Pose = None,
        size: Size = None,
        starter_wall: bool = False,
        wall_type: Wall_Type = Wall_Type.REGULAR,
    ) -> None:
        self.name = wall_type.value

        scale_x = size.x / Wall.real_world_size_x
        scale = Scale(scale_x)

        self.build_entity(pose, size, scale)

        if starter_wall:
            Wall.bypass_spawn_kill(self)
            self.spawn_wall()

    def spawn_wall(self) -> None:
        self.index = Obstacle.get_id()
        self.spawn_obstacle(self.name, self.index)

    @staticmethod
    def generate_random_wall_obstacles(n_walls: int) -> None:
        n_border_walls = random.randint(0, n_walls)
        n_inner_walls = n_walls - n_border_walls

        border_walls = [
            Wall._generate_random_border_wall() for _ in range(n_border_walls)
        ]
        inner_walls = [Wall._generate_random_inner_wall() for _ in range(n_inner_walls)]

        walls = border_walls + inner_walls
        for wall in walls:
            wall.spawn_wall()

    # fmt: off
    @staticmethod
    def _generate_random_border_wall() -> 'Wall':
        while True:
            start = Direction(random.randint(0, len(Direction) - 1))
            size=Size(x=random.uniform(MIN_WALL_LENGTH, MAP_WIDTH/2), z=WALL_HEIGHT)
            match(start):
                case Direction.NORTH :
                    wall = Wall(
                        pose=Pose(y=random.uniform(-MAP_WIDTH / 2 + WALL_GAP, MAP_WIDTH / 2 - WALL_GAP), x=MAP_WIDTH / 2 - size.x / 2 - WALL_GAP), size=size)
                case Direction.SOUTH : 
                    wall = Wall(
                        pose=Pose(y=random.uniform(-MAP_WIDTH / 2 + WALL_GAP, MAP_WIDTH / 2 - WALL_GAP), x=-MAP_WIDTH / 2 + size.x / 2 + WALL_GAP), size=size)
                case Direction.WEST : 
                    wall = Wall(
                        pose=Pose(x=random.uniform(-MAP_WIDTH / 2 + WALL_GAP, MAP_WIDTH / 2 - WALL_GAP), y=MAP_WIDTH / 2 - size.x / 2  - WALL_THICKNESS / 2, yaw=HORIZONTAL_YAW), size=size)
                case Direction.EAST : 
                    wall = Wall(
                        pose=Pose(x=random.uniform(-MAP_WIDTH / 2 + WALL_GAP, MAP_WIDTH / 2 - WALL_GAP), y=-MAP_WIDTH / 2 + size.x / 2 + WALL_THICKNESS / 2, yaw=HORIZONTAL_YAW), size=size)
            if not Wall.check_spawn_kill(wall):
                break
        return wall
    
    @staticmethod
    def _generate_random_inner_wall() -> 'Wall':
        while True:
            wall = Wall(
                        pose=Pose(x=random.uniform(-MAP_HEIGHT / 2 + WALL_THICKNESS, MAP_HEIGHT / 2 - WALL_THICKNESS), y=random.uniform(-MAP_WIDTH  / 2 + WALL_THICKNESS, MAP_WIDTH / 2 - WALL_THICKNESS), yaw=random.uniform(0, math.pi)), 
                        size=Size(x=random.uniform(MIN_WALL_LENGTH, MAP_WIDTH / 2), z=WALL_HEIGHT))
            
            if not Wall.check_spawn_kill(wall):
                break

        return wall

    # fmt: on
    @classmethod
    def check_spawn_kill(cls, wall: "Wall") -> bool:
        return super().check_spawn_kill(wall)

    @classmethod
    def bypass_spawn_kill(cls, wall: "Wall") -> bool:
        return super().bypass_spawn_kill(wall)
