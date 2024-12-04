import os
import sys
from typing import List, Tuple
import numpy as np
from abc import ABC, abstractmethod
from .pose import Pose
from .size import Size
from .scale import Scale
from ament_index_python.packages import get_package_share_directory


# pure abstract class
class Entity(ABC):
    pose: Pose
    size: Size
    name: str

    spawned_entities = []
    spawned_entities_nodes = []

    @abstractmethod
    def __init__(self) -> None:
        pass

    def build_entity(
        self, pose: Pose = None, size: Size = None, scale: Scale = None
    ) -> None:
        # Initialize pose with provided values or default values
        if pose:
            self.pose = Pose(
                x=pose.x,
                y=pose.y,
                z=pose.z,
                roll=pose.roll,
                pitch=pose.pitch,
                yaw=pose.yaw,
            )
        else:
            self.pose = Pose()

        # Initialize size with provided values or default values
        if size:
            self.size = Size(
                x=size.x,
                y=size.y,
                z=size.z,
            )
        else:
            self.size = Size()

            # Initialize scale with provided values or default values
        if scale:
            self.scale = Scale(
                x=scale.x,
                y=scale.y,
                z=scale.z,
            )
        else:
            self.scale = Scale()

    @staticmethod
    def load_model_sdf(model_name: str) -> str:
        try:
            pkg_project_description = get_package_share_directory(
                "ros_gz_example_description"
            )

            sdf_file = os.path.join(
                pkg_project_description, "models", model_name, "model.sdf"
            )

            if not os.path.isfile(sdf_file):
                raise FileNotFoundError(f"Model file '{sdf_file}' not found.")

            with open(sdf_file, "r") as infp:
                entity_desc = infp.read()

            return entity_desc

        except FileNotFoundError as e:
            print(f"Error: {e}")
            sys.exit(1)
        except Exception as e:
            print(f"Cannot open model file: {e}")
            sys.exit(1)

    @classmethod
    def check_spawn_kill(cls, new_entity: "Entity") -> bool:
        for spawned_entity in cls.spawned_entities:
            if Entity._boxes_overlap(new_entity, spawned_entity):
                return True
        cls.spawned_entities.append(new_entity)
        return False
    
    @classmethod
    def bypass_spawn_kill(cls, new_entity: "Entity") -> bool:
        cls.spawned_entities.append(new_entity)
        return False

    # OOB Collision Detection
    # based on: https://gamedev.stackexchange.com/questions/25397/obb-vs-obb-collision-detection

    @staticmethod
    def _get_normal_axes(yaw: float) -> Tuple[np.ndarray, np.ndarray]:
        unit_x = np.array([1, 0])  # Corresponds to the x-axis (width direction)
        unit_y = np.array([0, 1])  # Corresponds to the y-axis (height direction)

        # Create a 2D rotation matrix based on the yaw angle
        rotation_matrix = np.array(
            [[np.cos(yaw), -np.sin(yaw)], [np.sin(yaw), np.cos(yaw)]]
        )

        # Rotate the normal axes by the yaw
        rotated_x = np.dot(rotation_matrix, unit_x)
        rotated_y = np.dot(rotation_matrix, unit_y)

        return rotated_x, rotated_y

    @staticmethod
    def _project_point_onto_axis(point: np.ndarray, axis: np.ndarray) -> float:
        # Project a point onto an axis using the dot product
        return np.dot(point, axis) / np.linalg.norm(axis)

    @staticmethod
    def _get_box_corners(
        center: np.ndarray, width: float, height: float, yaw: float
    ) -> List[np.ndarray]:
        half_width = width / 2
        half_height = height / 2

        # Corners in the local box frame (before applying yaw)
        local_corners = np.array(
            [
                [-half_width, -half_height],
                [half_width, -half_height],
                [half_width, half_height],
                [-half_width, half_height],
            ]
        )

        # Rotation matrix for the yaw
        rotation_matrix = np.array(
            [[np.cos(yaw), -np.sin(yaw)], [np.sin(yaw), np.cos(yaw)]]
        )

        # Rotate corners and translate by the box's center
        world_corners = [
            np.dot(rotation_matrix, corner) + center for corner in local_corners
        ]

        return world_corners

    @staticmethod
    def _get_projection_range(
        corners: List[np.ndarray], axis: np.ndarray
    ) -> Tuple[float, float]:
        # Project each corner onto the axis and get the min and max projection
        projections = [
            Entity._project_point_onto_axis(corner, axis) for corner in corners
        ]
        return min(projections), max(projections)

    @staticmethod
    def _check_overlap(
        range1: Tuple[float, float], range2: Tuple[float, float]
    ) -> bool:
        # Check if two projection ranges overlap
        return not (range1[1] < range2[0] or range2[1] < range1[0])

    @staticmethod
    def _boxes_overlap(entity1: "Entity", entity2: "Entity") -> bool:
        # Get rotated normal axes for both boxes
        axes1 = Entity._get_normal_axes(entity1.pose.yaw)
        axes2 = Entity._get_normal_axes(entity2.pose.yaw)

        # Get the corners of both boxes
        corners1 = Entity._get_box_corners(
            entity1.pose.to_array()[0:2],
            entity1.size.x,
            entity1.size.y,
            entity1.pose.yaw,
        )
        corners2 = Entity._get_box_corners(
            entity2.pose.to_array()[0:2],
            entity2.size.x,
            entity2.size.y,
            entity2.pose.yaw,
        )

        # Check projections on each axis (both normal axes from box 1 and box 2)
        for axis in [axes1[0], axes1[1], axes2[0], axes2[1]]:
            range1 = Entity._get_projection_range(corners1, axis)
            range2 = Entity._get_projection_range(corners2, axis)
            if not Entity._check_overlap(range1, range2):
                return False  # Separating axis found, no overlap

        return True  # Overlap on all axes, boxes intersect
