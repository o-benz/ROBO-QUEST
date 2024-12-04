import numpy as np


class Size:
    def __init__(self, x: float = 0.0, y: float = 0.1, z: float = 0.2) -> None:
        self.x = x
        self.y = y
        self.z = z

    def to_array(self) -> np.ndarray:
        return np.array([self.x, self.y, self.z])
