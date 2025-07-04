#!/usr/bin/env python3
"""
Redis Cloud Connection Diagnostics
"""
import os
import sys
import ssl
import socket
import redis

def check_environment():
    """Check environment setup"""
    print("🔍 ENVIRONMENT CHECK")
    print("=" * 50)
    
    # Check Python version
    print(f"Python Version: {sys.version}")
    
    # Check Redis password
    password = os.environ.get('REDIS_PASSWORD')
    if password:
        print(f"✅ REDIS_PASSWORD is set (length: {len(password)})")
    else:
        print("❌ REDIS_PASSWORD is NOT set!")
        print("   Run: export REDIS_PASSWORD='your-password-here'")
    
    # Check redis-py version
    try:
        print(f"redis-py Version: {redis.__version__}")
    except:
        print("❌ Could not determine redis-py version")
    
    print()

def check_network():
    """Check network connectivity"""
    print("🌐 NETWORK CHECK")
    print("=" * 50)
    
    host = 'redis-16451.c280.us-central1-2.gce.redns.redis-cloud.com'
    port = 16451
    
    # Test DNS resolution
    try:
        ip = socket.gethostbyname(host)
        print(f"✅ DNS Resolution: {host} -> {ip}")
    except Exception as e:
        print(f"❌ DNS Resolution failed: {e}")
        return False
    
    # Test TCP connection
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(5)
        result = sock.connect_ex((host, port))
        sock.close()
        
        if result == 0:
            print(f"✅ TCP Connection: Can reach {host}:{port}")
        else:
            print(f"❌ TCP Connection failed: Error code {result}")
            return False
    except Exception as e:
        print(f"❌ TCP Connection error: {e}")
        return False
    
    print()
    return True

def test_ssl_versions():
    """Test different SSL/TLS versions"""
    print("🔐 SSL/TLS VERSION TEST")
    print("=" * 50)
    
    host = 'redis-16451.c280.us-central1-2.gce.redns.redis-cloud.com'
    port = 16451
    
    # Get default SSL version
    context = ssl.create_default_context()
    print(f"Default SSL Protocol: {context.protocol}")
    print(f"Available Ciphers: {len(context.get_ciphers())}")
    
    # Test different protocol versions
    protocols = [
        (ssl.PROTOCOL_TLS, "PROTOCOL_TLS (auto-negotiate)"),
        (ssl.PROTOCOL_TLSv1_2, "TLSv1.2"),
    ]
    
    if hasattr(ssl, 'PROTOCOL_TLSv1_3'):
        protocols.append((ssl.PROTOCOL_TLSv1_3, "TLSv1.3"))
    
    for protocol, name in protocols:
        try:
            context = ssl.SSLContext(protocol)
            context.check_hostname = False
            context.verify_mode = ssl.CERT_NONE
            
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(5)
            
            wrapped_sock = context.wrap_socket(sock)
            wrapped_sock.connect((host, port))
            
            print(f"✅ {name}: Connected successfully")
            print(f"   Cipher: {wrapped_sock.cipher()}")
            
            wrapped_sock.close()
        except Exception as e:
            print(f"❌ {name}: {str(e)[:100]}")
    
    print()

def test_redis_connections():
    """Test various Redis connection configurations"""
    print("🔧 REDIS CONNECTION TESTS")
    print("=" * 50)
    
    if not os.environ.get('REDIS_PASSWORD'):
        print("⚠️  Skipping Redis tests - REDIS_PASSWORD not set")
        return
    
    configs = [
        {
            "name": "Standard SSL",
            "params": {
                'ssl': True,
                'ssl_cert_reqs': 'none'
            }
        },
        {
            "name": "SSL with context",
            "params": {
                'ssl': True,
                'ssl_certfile': None,
                'ssl_keyfile': None,
                'ssl_ca_certs': None,
                'ssl_cert_reqs': 'none'
            }
        },
        {
            "name": "SSL with TLSv1.2",
            "params": {
                'ssl': True,
                'ssl_cert_reqs': ssl.CERT_NONE,
                'ssl_check_hostname': False
            }
        }
    ]
    
    base_params = {
        'host': 'redis-16451.c280.us-central1-2.gce.redns.redis-cloud.com',
        'port': 16451,
        'password': os.environ.get('REDIS_PASSWORD'),
        'decode_responses': True,
        'socket_connect_timeout': 10
    }
    
    for config in configs:
        print(f"\n📝 Testing: {config['name']}")
        try:
            params = {**base_params, **config['params']}
            client = redis.Redis(**params)
            client.ping()
            print(f"✅ SUCCESS: {config['name']} works!")
            
            # If successful, show Redis info
            info = client.info('server')
            print(f"   Redis Version: {info.get('redis_version', 'Unknown')}")
            print(f"   Mode: {info.get('redis_mode', 'Unknown')}")
            
            client.close()
            break
        except Exception as e:
            print(f"❌ FAILED: {str(e)[:150]}")

def main():
    """Run all diagnostics"""
    print("\n🏥 REDIS CLOUD CONNECTION DIAGNOSTICS")
    print("=" * 50)
    print()
    
    check_environment()
    
    if check_network():
        test_ssl_versions()
        test_redis_connections()
    
    print("\n💡 TROUBLESHOOTING TIPS:")
    print("=" * 50)
    print("1. Update redis-py: pip install --upgrade redis")
    print("2. Install with SSL support: pip install redis[hiredis]")
    print("3. Check firewall/proxy settings")
    print("4. Verify Redis Cloud endpoint and password")
    print("5. Try from a different network (e.g., mobile hotspot)")

if __name__ == "__main__":
    main()