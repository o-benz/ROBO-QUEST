import numpy as np


class Scale:
    def __init__(self, x: float = 1.0, y: float = 1.0, z: float = 1.0) -> None:
        self.x = x
        self.y = y
        self.z = z

    def to_array(self) -> np.ndarray:
        return np.array([self.x, self.y, self.z])
