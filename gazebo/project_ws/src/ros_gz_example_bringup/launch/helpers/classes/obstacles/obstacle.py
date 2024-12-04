from ..core.entity import Entity
from abc import abstractmethod
from launch_ros.actions import Node


# pure abstract class
class Obstacle(Entity):
    _id = 0

    @abstractmethod
    def __init__(self, name: str) -> None:
        pass

    @staticmethod
    def get_id() -> int:
        current_id = Obstacle._id
        Obstacle._id += 1
        return current_id

    def spawn_obstacle(self, model_name: str, index: int) -> Node:
        obstacle_desc = Entity.load_model_sdf(model_name)

        obstacle_desc = obstacle_desc.replace("{index}", str(index))
        obstacle_desc = obstacle_desc.replace("{size_x}", str(self.size.x))
        obstacle_desc = obstacle_desc.replace("{size_y}", str(self.size.y))
        obstacle_desc = obstacle_desc.replace("{size_z}", str(self.size.z))
        obstacle_desc = obstacle_desc.replace("{scale_x}", str(self.scale.x))
        obstacle_desc = obstacle_desc.replace("{scale_y}", str(self.scale.y))


        obstacle_node = Node(
            package="ros_gz_sim",
            executable="create",
            output="screen",
            arguments=[
                "-name",
                f"{self.name}{index}",
                "-string",
                obstacle_desc,
                "-x",
                str(self.pose.x),
                "-y",
                str(self.pose.y),
                "-z",
                str(self.pose.z),
                "-R",
                str(self.pose.roll),
                "-P",
                str(self.pose.pitch),
                "-Y",
                str(self.pose.yaw),
            ],
        )

        Entity.spawned_entities_nodes.append(obstacle_node)
        return obstacle_node

    @classmethod
    def check_spawn_kill(cls, obstacle: "Obstacle", skip: bool = False) -> bool:
        if skip: return
        return super().check_spawn_kill(obstacle)
    
    @classmethod
    def bypass_spawn_kill(cls, obstacle: "Obstacle") -> bool:
        return super().bypass_spawn_kill(obstacle)
