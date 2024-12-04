import socket

def get_local_ip():
    # Create a dummy socket to get the local IP
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            # Doesn't have to be reachable, just used to determine the local IP
            s.connect(('8.8.8.8', 80))
            return s.getsockname()[0]
    except Exception as e:
        return f"Unable to get local IP: {e}"

if __name__ == "__main__":
    ip_address = get_local_ip()
    with open('.env', 'w') as f:
        f.write(f"HOST_IP={ip_address}\n")