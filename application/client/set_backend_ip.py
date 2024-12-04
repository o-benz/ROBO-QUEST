import os

def get_ip_from_env():
    ip_address = os.getenv('HOST_IP')
    if not ip_address:
        raise ValueError("HOST_IP environment variable is not set.")
    return ip_address

def write_environment_file(ip_address):
    file_path = 'src/environments/environment.ts'    
    with open(file_path, 'w') as f:
        f.write(f"export const environment = {{\n")
        f.write(f"    production: false,\n")
        f.write(f"    serverUrl: 'http://{ip_address}:3000/api',\n")
        f.write(f"    serverUrlRoot: 'http://{ip_address}:3000/',\n")
        f.write(f"}};\n")
        
if __name__ == "__main__":
    ip_address = get_ip_from_env()
    write_environment_file(ip_address)