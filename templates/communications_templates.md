This document is designed to clarify the communication API between Robots and Server.
Please refer to ./application/SocketsEvents.ts for socket events names, for clarity should be same as command name
## Communications Robot-Server:

#### 1. Start Mission:
```json
{
    "command": "start_mission",
    "target": "robots | sim",
    "mission_details": {
        "orientation": 0.0,
        "position": {
            "x": 0.0,
            "y": 0.0
        }
    },
    "timestamp": "ISO 8601"
}
```

#### 2. End Mission:
```json
{
    "command": "end_mission",
    "target": "robots | sim",
    "timestamp": "ISO 8601"
}
```

#### 3. Update:
```json
{
    "command": "update",
    "name or id": "<identificate_which_updated>",
    "status": "<robot_status>",
    "position": {
        "x": 0.0,
        "y": 0.0
    },
    "timestamp": "ISO 8601"
}
```

#### 4. Return to Base:
```json
{
    "command": "return_to_base",
    "timestamp": "ISO 8601"
}
```

#### 5. Update Controller Code:
```json
{
    "command": "update_controller_code",
    "code": "<new_code>",
    "timestamp": "ISO 8601"
}
```

#### 6. Notify Robots to Communicate:
```json
{
    "command": "P2P",
    "timestamp": "ISO 8601"
}
```

#### 7. Identify Robot:
```json
{
    "command": "identify_robot",
    "target": "1 | 2"
}
```

## Communication Robot-Robot:

#### 1. Find the Furthest Robot:
```json
{
    "command": "find_furthest",
    "relative_point": {
        "x": 0.0,
        "y": 0.0
    },
    "timestamp": "ISO 8601"
}
```
