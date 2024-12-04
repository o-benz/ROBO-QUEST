import os
import sys
import random
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


class Geofence(Obstacle):
    real_world_size_x = 1
    real_world_size_y = 1

    def __init__(
        self,
        pose: Pose = Pose(z=-0.12),
        size: Size = Size(),
    ) -> None:
        self.name = "geofence"

        scale_x = size.x / Geofence.real_world_size_x
        scale_y = size.y / Geofence.real_world_size_x
        scale = Scale(scale_x, scale_y)

        self.build_entity(pose, size, scale)
        self.index = Obstacle.get_id()

        self.spawn_obstacle(self.name, self.index)
