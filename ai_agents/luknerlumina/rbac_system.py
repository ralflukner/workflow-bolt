"""
Role-Based Access Control System for LuknerLumina
"""

import logging
from datetime import datetime, timezone

class RoleBasedAccessControl:
    """Role-based access control system"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.roles = {
            "admin": ["read", "write", "delete", "manage_users"],
            "physician": ["read", "write", "patient_care"],
            "staff": ["read", "write"],
            "viewer": ["read"]
        }
        self.users = {}
        
    def add_user(self, username, role):
        """Add a user with a specific role"""
        if role not in self.roles:
            raise ValueError(f"Invalid role: {role}")
        
        self.users[username] = {
            "role": role,
            "permissions": self.roles[role].copy(),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        self.logger.info(f"Added user {username} with role {role}")
        
    def check_permission(self, username, permission):
        """Check if user has specific permission"""
        if username not in self.users:
            return False
        
        user_permissions = self.users[username]["permissions"]
        return permission in user_permissions
    
    def get_user_role(self, username):
        """Get user's role"""
        if username not in self.users:
            return None
        return self.users[username]["role"]
    
    def list_users(self):
        """List all users and their roles"""
        return {username: user["role"] for username, user in self.users.items()} 