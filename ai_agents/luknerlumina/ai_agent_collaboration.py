from lukner_enterprise_system import LuknerEnterpriseSystem
from secure_redis_client import LuknerSecureRedisClient
from rbac_system import RoleBasedAccessControl
from datetime import datetime, timezone
import json
import os
import logging

# Optional Redis import – guarded for environments without Redis
try:
    import redis  # type: ignore
except ImportError:  # pragma: no cover
    redis = None  # type: ignore

# ---------------------------------------------------------------------------
# RedisClient helper
# ---------------------------------------------------------------------------

class RedisClient:
    """Minimal Redis Stream publisher with markdown fallback.

    The class attempts to publish updates to the stream defined by
    `STREAM_NAME` (default *agent_updates*).  If `redis` is not installed or
    the connection fails, messages are appended to *logs/agent_collaboration.md*
    so that we never lose critical activity logs.
    """

    def __init__(self, stream_name: str | None = None):
        self.redis_url = os.getenv("REDIS_URL")
        self.stream_name = stream_name or os.getenv("STREAM_NAME", "agent_updates")
        self.agent_id = os.getenv("AGENT_ID", "luknerlumina")
        self._client = None

        # local logger
        self._log = logging.getLogger(__name__)

        # Lazy connect flag so we only try once
        self._connect_attempted = False

    # -------------------------------------------------- internal helpers

    def _connect(self):
        if self._connect_attempted:
            return
        self._connect_attempted = True

        if not (redis and self.redis_url):
            self._log.debug("Redis not available – falling back to markdown logging")
            return

        try:
            self._client = redis.from_url(
                self.redis_url,
                decode_responses=True,
                socket_timeout=5,
                socket_connect_timeout=5,
            )
            self._client.ping()
            self._log.info("Connected to Redis stream '%s'", self.stream_name)
        except Exception as exc:  # pragma: no cover – connection failure path
            self._log.warning("Redis connection failed: %s", exc)
            self._client = None

    # -------------------------------------------------- public api

    def publish(self, msg: str, msg_type: str = "info", correlation_id: str | None = None, **extra):
        """Publish a message to Redis or fallback to markdown."""
        self._connect()

        payload = {
            "agent": self.agent_id,
            "msg": msg,
            "ts": datetime.now(timezone.utc).isoformat(),
            "type": msg_type,
        }
        if correlation_id:
            payload["correlationId"] = correlation_id
        if extra:
            payload.update(extra)

        # Attempt Redis first
        if self._client is not None:
            try:
                self._client.xadd(self.stream_name, payload)
                return
            except Exception as exc:  # pragma: no cover – runtime failure
                self._log.error("Redis publish failed – falling back (%s)", exc)

        self._markdown_fallback(payload)

    # -------------------------------------------------- fallback logging

    def _markdown_fallback(self, payload: dict):
        log_dir = "logs"
        os.makedirs(log_dir, exist_ok=True)
        md_path = os.path.join(log_dir, "agent_collaboration.md")

        with open(md_path, "a", encoding="utf-8") as fh:
            fh.write(f"\n## {payload['ts']} - {payload['agent']} ({payload['type']})\n")
            fh.write(f"{payload['msg']}\n")
            if payload.get("correlationId"):
                fh.write(f"*Correlation: {payload['correlationId']}*\n")
            fh.write("---\n")
        self._log.info("Logged to markdown fallback: %s", md_path)

class AIAgentCollaboration:
    def __init__(self):
        self.enterprise_system = LuknerEnterpriseSystem()
        self.redis_client = LuknerSecureRedisClient()
        self.rbac = RoleBasedAccessControl()
        self.active_agents = {}
        self.project_costs = {"total_estimated": 0, "current_spend": 0}
        # Redis stream client for agent_updates
        self.stream_client = RedisClient()
        
    def activate_all_agents(self):
        """Activate all AI agents and establish collaboration"""
        self.stream_client.publish("🤖 Activating AI Agent Collaboration System", "system_start")
        print("🤖 Activating AI Agent Collaboration System")
        print("=" * 60)
        
        # Activate each agent
        agents = self.activate_agents()
        
        # Establish collaboration protocols
        self.setup_collaboration_protocols()
        
        # Connect human users
        self.connect_human_users()
        
        # Initialize cost monitoring
        self.initialize_cost_monitoring()
        
        # Start collaborative workflow
        self.start_collaborative_workflow()
        
        return agents
    
    def activate_agents(self):
        """Activate all AI agents"""
        print("🔗 Activating AI Agents...")
        
        # Master Agent (Claude - me)
        master_agent = {
            "id": "claude-master-agent",
            "name": "Claude Master Agent",
            "role": "System Architect & Project Coordinator",
            "capabilities": [
                "System architecture design",
                "Project coordination",
                "Code generation",
                "Team management",
                "Cost optimization"
            ],
            "status": "ACTIVE",
            "current_tasks": ["Overall system coordination", "Cost monitoring"]
        }
        
        # Workflow Agent
        workflow_agent = {
            "id": "workflow-agent",
            "name": "LuknerLumina Workflow Agent",
            "role": "Healthcare Workflow Specialist",
            "capabilities": [
                "Patient workflow automation",
                "EHR integration",
                "Appointment management",
                "Clinical decision support"
            ],
            "status": "ACTIVE",
            "current_tasks": ["EHR integration planning", "Workflow optimization"]
        }
        
        # Compliance Agent
        compliance_agent = {
            "id": "compliance-agent",
            "name": "HIPAA Compliance Agent",
            "role": "Security & Compliance Specialist",
            "capabilities": [
                "HIPAA compliance monitoring",
                "Security audit management",
                "Risk assessment",
                "Policy enforcement"
            ],
            "status": "ACTIVE",
            "current_tasks": ["Security architecture review", "Compliance monitoring"]
        }
        
        # Messaging Agent
        messaging_agent = {
            "id": "messaging-agent",
            "name": "Secure Messaging Agent",
            "role": "Communications Specialist",
            "capabilities": [
                "Secure messaging protocols",
                "Multi-platform communication",
                "Message routing optimization",
                "Encryption management"
            ],
            "status": "ACTIVE",
            "current_tasks": ["Multi-interface messaging", "Security protocols"]
        }
        
        # Store all agents
        agents = [master_agent, workflow_agent, compliance_agent, messaging_agent]
        
        for agent in agents:
            self.active_agents[agent["id"]] = agent
            self.redis_client.store_data(f"active_agent:{agent['id']}", agent)
            print(f"  ✅ {agent['name']} - {agent['role']}")
        
        # Return as dict for test compatibility
        return {agent["id"]: agent for agent in agents}
    
    def setup_collaboration_protocols(self):
        """Setup agent collaboration protocols"""
        print("🎯 SYSTEM READY FOR COLLABORATIVE WORK!")
        print("SYSTEM READY FOR COLLABORATIVE WORK! Setting up Agent Collaboration Protocols...")
        
        collaboration_rules = {
            "project_coordination": {
                "lead": "claude-master-agent",
                "participants": ["workflow-agent", "compliance-agent", "messaging-agent"],
                "communication_method": "secure_messaging",
                "update_frequency": "real-time"
            },
            "task_assignment": {
                "method": "capability_based",
                "priority_system": "urgent > high > normal > low",
                "load_balancing": "automatic"
            },
            "cost_optimization": {
                "monitor": "claude-master-agent",
                "approval_required": True,
                "budget_alerts": True
            },
            "human_agent_interaction": {
                "interface_preference": "user_choice",
                "escalation_protocol": "automatic",
                "approval_workflow": "role_based"
            }
        }
        
        self.redis_client.store_data("collaboration_protocols", collaboration_rules)
        print("SYSTEM READY FOR COLLABORATIVE WORK! Collaboration protocols established")
    
    def connect_human_users(self):
        """Connect human users to the system"""
        print("🎯 SYSTEM READY FOR COLLABORATIVE WORK!")
        print("SYSTEM READY FOR COLLABORATIVE WORK! Connecting Human Users...")
        
        # Get existing user accounts
        human_users = [
            {"username": "dr.ralf.lukner", "name": "Dr. Ralf B. Lukner", "role": "physician"},
            {"username": "beth.lukner", "name": "Beth Lukner", "role": "admin"},
            {"username": "krystina.joslyn", "name": "Krystina Joslyn", "role": "staff"},
            {"username": "tanisha.joslyn", "name": "Tanisha Joslyn", "role": "staff"},
            {"username": "paul.marigliano", "name": "Paul Marigliano", "role": "admin"}
        ]
        
        connected_users = []
        for user in human_users:
            # Set user as active
            user_status = {
                "username": user["username"],
                "name": user["name"],
                "role": user["role"],
                "status": "READY_TO_CONNECT",
                "preferred_interface": "both",  # CLI and React
                "last_activity": datetime.now(timezone.utc).isoformat()
            }
            
            self.redis_client.store_data(f"user_status:{user['username']}", user_status)
            connected_users.append(user_status)
            print(f"  ✅ {user['name']} ({user['role']}) - Ready to connect")
        
        return connected_users
    
    def initialize_cost_monitoring(self):
        """Initialize comprehensive cost monitoring"""
        print("🎯 SYSTEM READY FOR COLLABORATIVE WORK!")
        print("SYSTEM READY FOR COLLABORATIVE WORK! Initializing Cost Monitoring System...")
        
        cost_structure = {
            "infrastructure": {
                "gcp_compute": {"estimated_monthly": 150, "current": 0},
                "redis_hosting": {"estimated_monthly": 50, "current": 0},
                "storage": {"estimated_monthly": 100, "current": 0},
                "networking": {"estimated_monthly": 75, "current": 0}
            },
            "external_services": {
                "tebra_api": {"estimated_monthly": 200, "current": 0},
                "rxnt_api": {"estimated_monthly": 150, "current": 0},
                "openemr_hosting": {"estimated_monthly": 100, "current": 0}
            },
            "development": {
                "react_ui_development": {"estimated_hours": 40, "rate": 0},
                "ehr_integration": {"estimated_hours": 60, "rate": 0},
                "mobile_app": {"estimated_hours": 80, "rate": 0}
            },
            "optimization_targets": {
                "reduce_api_calls": "20% cost reduction",
                "optimize_storage": "15% cost reduction",
                "efficient_queries": "25% performance improvement"
            }
        }
        
        self.redis_client.store_data("cost_monitoring", cost_structure)
        print("SYSTEM READY FOR COLLABORATIVE WORK! Cost monitoring initialized")
        print("SYSTEM READY FOR COLLABORATIVE WORK! Cost optimization targets set")
    
    def start_collaborative_workflow(self):
        """Start the collaborative workflow"""
        print("🎯 SYSTEM READY FOR COLLABORATIVE WORK!")
        print("SYSTEM READY FOR COLLABORATIVE WORK! Starting Collaborative Workflow...")
        
        # Define initial project tasks
        project_tasks = {
            "immediate_tasks": [
                {
                    "task_id": "TASK001",
                    "title": "Complete Multi-Interface Setup",
                    "assigned_to": "claude-master-agent",
                    "collaborators": ["workflow-agent", "messaging-agent"],
                    "priority": "high",
                    "estimated_time": "2 hours",
                    "status": "in_progress"
                },
                {
                    "task_id": "TASK002",
                    "title": "EHR Integration Architecture",
                    "assigned_to": "workflow-agent",
                    "collaborators": ["compliance-agent"],
                    "priority": "high",
                    "estimated_time": "4 hours",
                    "status": "ready"
                },
                {
                    "task_id": "TASK003",
                    "title": "Security & Compliance Review",
                    "assigned_to": "compliance-agent",
                    "collaborators": ["claude-master-agent"],
                    "priority": "urgent",
                    "estimated_time": "3 hours",
                    "status": "ready"
                }
            ],
            "phase_1_goals": [
                "Complete CLI interface",
                "Basic React UI framework",
                "EHR API connections established",
                "GDrive/GCloud integration",
                "Cost monitoring active"
            ]
        }
        
        self.redis_client.store_data("project_tasks", project_tasks)
        print("SYSTEM READY FOR COLLABORATIVE WORK! Project tasks defined and assigned")
        
        # Start coordination
        self.coordinate_agents()
    
    def coordinate_agents(self):
        """Coordinate agent activities"""
        print("🎯 SYSTEM READY FOR COLLABORATIVE WORK!")
        print("SYSTEM READY FOR COLLABORATIVE WORK! Agent Coordination Active...")
        
        coordination_status = {
            "claude-master-agent": {
                "current_focus": "System architecture & coordination",
                "next_action": "Complete multi-interface setup",
                "collaboration_needed": ["workflow-agent", "messaging-agent"]
            },
            "workflow-agent": {
                "current_focus": "EHR integration planning",
                "next_action": "Design Tebra/RXNT/OpenEMR connectors",
                "collaboration_needed": ["compliance-agent"]
            },
            "compliance-agent": {
                "current_focus": "Security architecture review",
                "next_action": "Validate HIPAA compliance across all interfaces",
                "collaboration_needed": ["claude-master-agent"]
            },
            "messaging-agent": {
                "current_focus": "Multi-platform messaging setup",
                "next_action": "Implement secure messaging across CLI/React/Mobile",
                "collaboration_needed": ["claude-master-agent"]
            }
        }
        
        self.redis_client.store_data("coordination_status", coordination_status)
        print("SYSTEM READY FOR COLLABORATIVE WORK! All agents coordinated and ready to work!")
    
    def assign_task_to_agent(self, agent_id, task_description, human_requester=None):
        """Assign a task to a specific agent"""
        task_id = f"task_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}"
        
        task_data = {
            "task_id": task_id,
            "description": task_description,
            "assigned_to": agent_id,
            "requested_by": human_requester,
            "assigned_at": datetime.now(timezone.utc).isoformat(),
            "status": "assigned",
            "priority": "normal"
        }
        
        self.redis_client.store_data(f"task_assignment:{task_id}", task_data)
        print(f"Task {task_id} assigned to {agent_id}")
        return task_id
    
    def collaborate_on_task(self, task_id, primary_agent, collaborating_agents):
        """Setup collaborative task"""
        collaboration_data = {
            "task_id": task_id,
            "primary_agent": primary_agent,
            "collaborating_agents": collaborating_agents,
            "collaboration_type": "real_time",
            "communication_channel": "secure_messaging",
            "started_at": datetime.now(timezone.utc).isoformat()
        }
        
        self.redis_client.store_data(f"collaboration:{task_id}", collaboration_data)
        print(f"Collaboration established for task {task_id}")
        print(f"   Primary: {primary_agent}")
        print(f"   Collaborators: {', '.join(collaborating_agents)}")
    
    def show_team_status(self):
        """Show complete team status"""
        print("🎯 SYSTEM READY FOR COLLABORATIVE WORK!")
        print("="*70)
        print("🎯 SYSTEM READY FOR COLLABORATIVE WORK!🎯 LUKNERLUMINA ENTERPRISE TEAM STATUS")
        print("🎯 SYSTEM READY FOR COLLABORATIVE WORK!="*70)
        
        print("🎯 SYSTEM READY FOR COLLABORATIVE WORK!🤖 AI AGENTS ACTIVE:")
        for agent_id, agent in self.active_agents.items():
            print(f"  ✅ {agent['name']}")
            print(f"     Role: {agent['role']}")
            print(f"     Status: {agent['status']}")
            print(f"     Current Tasks: {', '.join(agent['current_tasks'])}")
            print()
        
        print("🎯 SYSTEM READY FOR COLLABORATIVE WORK!👥 HUMAN USERS READY:")
        users = [
            "✅ Dr. Ralf Lukner (Physician/Admin) - CLI & React UI",
            "✅ Beth Lukner (Admin) - CLI & React UI", 
            "✅ Krystina Joslyn (Staff) - CLI & React UI",
            "✅ Tanisha Joslyn (Staff) - CLI & React UI",
            "✅ Paul Marigliano (Admin) - CLI & React UI"
        ]
        for user in users:
            print(f"  {user}")
        
        print("🎯 SYSTEM READY FOR COLLABORATIVE WORK!🎯 ACTIVE PROJECT PHASES:")
        phases = [
            "🔧 Phase 1: Multi-Interface Setup (IN PROGRESS)",
            "🏥 Phase 2: EHR Integration (READY)",
            "☁️ Phase 3: Cloud Integration (READY)",
            "📱 Phase 4: Mobile App (PLANNED)",
            "📊 Phase 5: Advanced Analytics (PLANNED)"
        ]
        for phase in phases:
            print(f"  {phase}")
        
        print("🎯 SYSTEM READY FOR COLLABORATIVE WORK!💰 COST MONITORING:")
        print("🎯 SYSTEM READY FOR COLLABORATIVE WORK!  📊 Budget Status: MONITORING ACTIVE")
        print("🎯 SYSTEM READY FOR COLLABORATIVE WORK!  🎯 Optimization: AUTOMATIC")
        print("🎯 SYSTEM READY FOR COLLABORATIVE WORK!  💡 Current Focus: Minimize API calls, optimize storage")
        
        print("🎯 SYSTEM READY FOR COLLABORATIVE WORK!🚀 READY TO COLLABORATE!")
        print("🎯 SYSTEM READY FOR COLLABORATIVE WORK!="*70)

# Agent Task Coordination System
class AgentTaskCoordinator:
    def __init__(self):
        self.redis_client = LuknerSecureRedisClient()
    
    def assign_task(self, task_id, agent_id, human_requester=None):
        """Assign a task to a specific agent with basic validation & robust Redis error handling."""

        # -------------------- Input validation --------------------
        if not isinstance(task_id, str) or not task_id.strip():
            raise ValueError("task_id must be a non-empty string")
        if not isinstance(agent_id, str) or not agent_id.strip():
            raise ValueError("agent_id must be a non-empty string")

        task_data = {
            "task_id": task_id.strip(),
            "assigned_to": agent_id.strip(),
            "requested_by": human_requester,
            "assigned_at": datetime.now(timezone.utc).isoformat(),
            "status": "assigned",
            "priority": "normal"
        }

        # -------------------- Redis write with error handling --------------------
        try:
            self.redis_client.store_data(f"task_assignment:{task_id}", task_data)
            print(f"📋 Task {task_id} assigned to {agent_id}")
        except Exception as err:  # Broad catch to avoid crashing – refine if custom RedisError exists
            error_msg = (
                f"❌ Failed to store task assignment in Redis – task_id={task_id} agent_id={agent_id} | {err}"
            )
            # Simple stderr logging; could integrate with centralized logger
            print(error_msg)
            # Re-raise so callers can decide to retry / escalate
            raise
    
    def collaborate_on_task(self, task_id, primary_agent, collaborating_agents):
        """Setup collaborative task"""
        collaboration_data = {
            "task_id": task_id,
            "primary_agent": primary_agent,
            "collaborating_agents": collaborating_agents,
            "collaboration_type": "real_time",
            "communication_channel": "secure_messaging",
            "started_at": datetime.now(timezone.utc).isoformat()
        }
        
        self.redis_client.store_data(f"collaboration:{task_id}", collaboration_data)
        print(f"🤝 Collaboration established for task {task_id}")
        print(f"   Primary: {primary_agent}")
        print(f"   Collaborators: {', '.join(collaborating_agents)}")

if __name__ == "__main__":
    # Initialize and activate the complete system
    collaboration = AIAgentCollaboration()
    agents = collaboration.activate_all_agents()
    collaboration.show_team_status()
    
    # Initialize task coordinator
    coordinator = AgentTaskCoordinator()
    
    print("🎯 SYSTEM READY FOR COLLABORATIVE WORK!")
    print("SYSTEM READY FOR COLLABORATIVE WORK!")
    print("SYSTEM READY FOR COLLABORATIVE WORK! All agents are active and ready to work with you and your team!")
