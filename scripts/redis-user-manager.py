#!/usr/bin/env python3
"""
Redis User Manager with TOTP 2FA and Automated Secret Rotation
Uses Google Cloud Secret Manager and Redis ACL for comprehensive authentication
"""

import os
import json
import secrets
import string
import base64
import qrcode
import io
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Tuple
import argparse

import pyotp
from google.cloud import secretmanager
import redis


class RedisUserManager:
    """Manages Redis users with TOTP 2FA and secret rotation"""
    
    def __init__(self, project_id: str = "luknerlumina-firebase"):
        self.project_id = project_id
        self.secret_client = secretmanager.SecretManagerServiceClient()
        self.redis_client = None
        
    def connect_redis(self) -> redis.Redis:
        """Connect to Redis using current credentials"""
        if self.redis_client:
            return self.redis_client
            
        # Get Redis password from Secret Manager
        redis_pass = self._get_secret("redis-event-bus-pass")
        
        self.redis_client = redis.Redis(
            host="redis-16451.c280.us-central1-2.gce.redns.redis-cloud.com",
            port=16451,
            username="default",
            password=redis_pass,
            ssl=True,
            ssl_cert_reqs=None
        )
        return self.redis_client
        
    def _get_secret(self, secret_id: str) -> str:
        """Get secret value from Google Secret Manager"""
        name = f"projects/{self.project_id}/secrets/{secret_id}/versions/latest"
        response = self.secret_client.access_secret_version(request={"name": name})
        return response.payload.data.decode("UTF-8").strip()
        
    def _update_secret(self, secret_id: str, value: str) -> None:
        """Update secret in Google Secret Manager"""
        parent = f"projects/{self.project_id}"
        secret_name = f"{parent}/secrets/{secret_id}"
        
        # Add new version
        self.secret_client.add_secret_version(
            request={
                "parent": secret_name,
                "payload": {"data": value.encode("UTF-8")}
            }
        )
        
    def generate_username(self, base_name: str = "claude") -> str:
        """Generate unique Redis username"""
        # Generate random suffix like: claude-sd3fjhlaserhjhaswpa2
        suffix = ''.join(secrets.choice(string.ascii_lowercase + string.digits) 
                        for _ in range(20))
        return f"{base_name}-{suffix}"
        
    def generate_strong_password(self, length: int = 32) -> str:
        """Generate cryptographically strong password"""
        # Use all character types for maximum entropy
        chars = (string.ascii_letters + string.digits + 
                "!@#$%^&*()_+-=[]{}|;:,.<>?")
        return ''.join(secrets.choice(chars) for _ in range(length))
        
    def generate_totp_secret(self) -> str:
        """Generate TOTP secret key"""
        return pyotp.random_base32()
        
    def generate_custom_2fa_formula(self) -> List[int]:
        """Generate 10-integer array for custom 2FA formula"""
        return [secrets.randbelow(1000) for _ in range(10)]
        
    def compute_custom_2fa(self, formula: List[int], timestamp: Optional[int] = None) -> str:
        """Compute custom 2FA code using user's formula"""
        if timestamp is None:
            timestamp = int(datetime.now(timezone.utc).timestamp())
            
        # Custom algorithm using the 10-integer formula
        # Each user can have different formula = different 2FA even with same timestamp
        time_factor = timestamp // 30  # 30-second windows like TOTP
        
        result = 0
        for i, factor in enumerate(formula):
            result += (factor * time_factor * (i + 1)) % 999999
            
        # Return 6-digit code
        return f"{result % 1000000:06d}"
        
    def create_user(self, username: str, user_type: str = "agent") -> Dict:
        """Create new Redis user with TOTP 2FA"""
        redis_conn = self.connect_redis()
        
        # Generate credentials
        password = self.generate_strong_password(32)
        totp_secret = self.generate_totp_secret()
        custom_formula = self.generate_custom_2fa_formula()
        
        # Create Redis ACL user
        permissions = "+@all allkeys allchannels"  # Full access - customize as needed
        redis_conn.execute_command(
            "ACL", "SETUSER", username, 
            "on", f">{password}", permissions
        )
        
        # Create user configuration
        user_config = {
            "username": username,
            "user_type": user_type,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "last_rotation": datetime.now(timezone.utc).isoformat(),
            "next_rotation": (datetime.now(timezone.utc) + timedelta(days=90)).isoformat(),
            "totp_secret": totp_secret,
            "custom_formula": custom_formula,
            "compromised": False,
            "active": True
        }
        
        # Store in Secret Manager
        self._update_secret(f"redis-user-{username}-password", password)
        self._update_secret(f"redis-user-{username}-config", json.dumps(user_config))
        
        # Update master users list
        try:
            users_config = json.loads(self._get_secret("redis-users-config"))
        except:
            users_config = {"users": {}}
            
        users_config["users"][username] = {
            "user_type": user_type,
            "created_at": user_config["created_at"],
            "active": True
        }
        
        self._update_secret("redis-users-config", json.dumps(users_config, indent=2))
        
        return {
            "username": username,
            "password": password,
            "totp_secret": totp_secret,
            "custom_formula": custom_formula,
            "qr_code_url": self._generate_qr_code_url(username, totp_secret)
        }
        
    def _generate_qr_code_url(self, username: str, totp_secret: str) -> str:
        """Generate QR code URL for Google Authenticator"""
        totp = pyotp.TOTP(totp_secret)
        provisioning_uri = totp.provisioning_uri(
            name=username,
            issuer_name="LuknerLumina-Redis"
        )
        return provisioning_uri
        
    def generate_qr_code_image(self, username: str) -> bytes:
        """Generate QR code image for TOTP setup"""
        config = json.loads(self._get_secret(f"redis-user-{username}-config"))
        totp_secret = config["totp_secret"]
        
        qr_url = self._generate_qr_code_url(username, totp_secret)
        
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(qr_url)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convert to bytes
        img_buffer = io.BytesIO()
        img.save(img_buffer, format='PNG')
        return img_buffer.getvalue()
        
    def verify_totp(self, username: str, totp_code: str) -> bool:
        """Verify TOTP code for user"""
        config = json.loads(self._get_secret(f"redis-user-{username}-config"))
        totp_secret = config["totp_secret"]
        
        totp = pyotp.TOTP(totp_secret)
        return totp.verify(totp_code, valid_window=1)  # Allow 1 window tolerance
        
    def verify_custom_2fa(self, username: str, custom_code: str) -> bool:
        """Verify custom 2FA code for user"""
        config = json.loads(self._get_secret(f"redis-user-{username}-config"))
        custom_formula = config["custom_formula"]
        
        expected_code = self.compute_custom_2fa(custom_formula)
        return custom_code == expected_code
        
    def rotate_user_secrets(self, username: str, force: bool = False) -> Dict:
        """Rotate TOTP and custom formula secrets for user"""
        config = json.loads(self._get_secret(f"redis-user-{username}-config"))
        
        # Check if rotation is needed
        next_rotation = datetime.fromisoformat(config["next_rotation"].replace('Z', '+00:00'))
        if not force and datetime.now(timezone.utc) < next_rotation:
            return {"status": "not_needed", "next_rotation": next_rotation.isoformat()}
            
        # Generate new secrets
        new_totp_secret = self.generate_totp_secret()
        new_custom_formula = self.generate_custom_2fa_formula()
        
        # Update configuration
        config["totp_secret"] = new_totp_secret
        config["custom_formula"] = new_custom_formula
        config["last_rotation"] = datetime.now(timezone.utc).isoformat()
        config["next_rotation"] = (datetime.now(timezone.utc) + timedelta(days=90)).isoformat()
        
        # Store updated config
        self._update_secret(f"redis-user-{username}-config", json.dumps(config))
        
        return {
            "status": "rotated",
            "username": username,
            "new_totp_secret": new_totp_secret,
            "new_custom_formula": new_custom_formula,
            "qr_code_url": self._generate_qr_code_url(username, new_totp_secret),
            "next_rotation": config["next_rotation"]
        }
        
    def mark_compromised(self, username: str) -> Dict:
        """Mark user as compromised and force immediate rotation"""
        config = json.loads(self._get_secret(f"redis-user-{username}-config"))
        config["compromised"] = True
        config["compromised_at"] = datetime.now(timezone.utc).isoformat()
        
        # Store updated config
        self._update_secret(f"redis-user-{username}-config", json.dumps(config))
        
        # Force rotation
        rotation_result = self.rotate_user_secrets(username, force=True)
        
        return {
            "status": "compromised_and_rotated",
            "username": username,
            "rotation_result": rotation_result
        }
        
    def list_users(self) -> List[Dict]:
        """List all Redis users"""
        try:
            users_config = json.loads(self._get_secret("redis-users-config"))
            return users_config.get("users", {})
        except:
            return {}
            
    def delete_user(self, username: str) -> Dict:
        """Delete Redis user and all associated secrets"""
        redis_conn = self.connect_redis()
        
        # Remove from Redis ACL
        redis_conn.execute_command("ACL", "DELUSER", username)
        
        # Remove secrets (mark as disabled)
        try:
            config = json.loads(self._get_secret(f"redis-user-{username}-config"))
            config["active"] = False
            config["deleted_at"] = datetime.now(timezone.utc).isoformat()
            self._update_secret(f"redis-user-{username}-config", json.dumps(config))
        except:
            pass
            
        # Update master users list
        try:
            users_config = json.loads(self._get_secret("redis-users-config"))
            if username in users_config.get("users", {}):
                users_config["users"][username]["active"] = False
                self._update_secret("redis-users-config", json.dumps(users_config, indent=2))
        except:
            pass
            
        return {"status": "deleted", "username": username}


def main():
    parser = argparse.ArgumentParser(description="Redis User Manager with TOTP 2FA")
    parser.add_argument("command", choices=[
        "create", "rotate", "verify-totp", "verify-custom", 
        "list", "delete", "mark-compromised", "qr-code"
    ])
    parser.add_argument("--username", help="Username to operate on")
    parser.add_argument("--user-type", default="agent", choices=["agent", "human"], 
                       help="Type of user to create")
    parser.add_argument("--totp-code", help="TOTP code to verify")
    parser.add_argument("--custom-code", help="Custom 2FA code to verify")
    parser.add_argument("--force", action="store_true", help="Force operation")
    parser.add_argument("--output-qr", help="Output QR code image to file")
    
    args = parser.parse_args()
    
    manager = RedisUserManager()
    
    try:
        if args.command == "create":
            if not args.username:
                username = manager.generate_username("claude" if args.user_type == "agent" else "human")
            else:
                username = args.username
                
            result = manager.create_user(username, args.user_type)
            print(f"✅ Created user: {result['username']}")
            print(f"🔑 Password: {result['password']}")
            print(f"🔐 TOTP Secret: {result['totp_secret']}")
            print(f"🧮 Custom Formula: {result['custom_formula']}")
            print(f"📱 QR Code URL: {result['qr_code_url']}")
            
        elif args.command == "rotate":
            if not args.username:
                print("❌ Username required for rotation")
                return
                
            result = manager.rotate_user_secrets(args.username, args.force)
            print(f"🔄 Rotation result: {result['status']}")
            if result['status'] == "rotated":
                print(f"🔐 New TOTP Secret: {result['new_totp_secret']}")
                print(f"🧮 New Custom Formula: {result['new_custom_formula']}")
                
        elif args.command == "verify-totp":
            if not args.username or not args.totp_code:
                print("❌ Username and TOTP code required")
                return
                
            valid = manager.verify_totp(args.username, args.totp_code)
            print(f"✅ TOTP Valid" if valid else "❌ TOTP Invalid")
            
        elif args.command == "verify-custom":
            if not args.username or not args.custom_code:
                print("❌ Username and custom code required")
                return
                
            valid = manager.verify_custom_2fa(args.username, args.custom_code)
            print(f"✅ Custom 2FA Valid" if valid else "❌ Custom 2FA Invalid")
            
        elif args.command == "list":
            users = manager.list_users()
            print(f"📋 Redis Users ({len(users)}):")
            for username, info in users.items():
                status = "🟢" if info.get("active", True) else "🔴"
                print(f"  {status} {username} ({info.get('user_type', 'unknown')})")
                
        elif args.command == "mark-compromised":
            if not args.username:
                print("❌ Username required")
                return
                
            result = manager.mark_compromised(args.username)
            print(f"🚨 User {args.username} marked as compromised and secrets rotated")
            
        elif args.command == "delete":
            if not args.username:
                print("❌ Username required")
                return
                
            result = manager.delete_user(args.username)
            print(f"🗑️ User {args.username} deleted")
            
        elif args.command == "qr-code":
            if not args.username:
                print("❌ Username required")
                return
                
            qr_image = manager.generate_qr_code_image(args.username)
            
            if args.output_qr:
                with open(args.output_qr, 'wb') as f:
                    f.write(qr_image)
                print(f"📱 QR code saved to {args.output_qr}")
            else:
                print(f"📱 QR code generated ({len(qr_image)} bytes)")
                
    except Exception as e:
        print(f"❌ Error: {e}")
        return 1
        
    return 0


if __name__ == "__main__":
    exit(main())