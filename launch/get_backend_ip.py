import subprocess

def get_ip_from_wsl():
    command = f'python3 get_ip.py'
    subprocess.run(['powershell.exe', '-Command', command])

def get_ip_from_native_linux():
    command = f'python3 get_ip.py'
    subprocess.run(['bash', '-c', command])

if __name__ == "__main__":
    try:
        get_ip_from_wsl()
    except:
        get_ip_from_native_linux()