# ai-agents/redis_event_bus_replier.py
"""Redis Event-Bus Replier

This small utility listens to the shared `agent_updates` Redis stream and responds
(or "acknowledges") to a subset of recognised actions.  It is primarily meant for
dev-testing and demos – keeping the feedback loop tight when multiple team-members
are experimenting with the event-bus.

Behaviour:

1. Connects to the same Redis instance used by the rest of the Event-Bus helpers
   (credentials come from environment variables; see `redis_event_bus.py`).
2. Ensures a consumer-group (default: ``repliers``) exists on the stream so that
   message delivery is load-balanced when multiple repliers are running.
3. Continuously blocks on ``XREADGROUP`` to fetch new messages.
4. For each message it will:
   • Log to stdout what it received.
   • Dispatch simple replies via ``send_message`` – e.g. on a ``hello_world`` it
     answers with ``hello_reply``; on ``lock_shell`` it answers with ``lock_ack``.
   • ``XACK`` the processed entry so it does not redeliver.

Run locally with:  ``python -m ai-agents.redis_event_bus_replier``

(Assumes ``REDIS_PASS`` env-var is set)
"""

from __future__ import annotations

import json
import os
import time
from typing import Dict, Any

import redis  # type: ignore

# Re-use helpers from the existing event-bus client
from .redis_event_bus import (
    connect_to_redis,
    send_message,
    STREAM_NAME,
)

CONSUMER_GROUP = os.environ.get("REDIS_CONSUMER_GROUP", "repliers")
CONSUMER_NAME = os.environ.get("REDIS_CONSUMER_NAME", os.environ.get("USER", "replier"))
BLOCK_MS = int(os.environ.get("REDIS_BLOCK_MS", "5000"))  # Wait up to 5s


def ensure_consumer_group(client: "redis.Redis") -> None:
    """Make sure the consumer-group exists (idempotent)."""
    try:
        client.xgroup_create(STREAM_NAME, CONSUMER_GROUP, id="0", mkstream=True)
        print(f"✅ Created consumer-group '{CONSUMER_GROUP}' on stream '{STREAM_NAME}'")
    except redis.ResponseError as exc:
        # Ignore the BUSYGROUP error – it just means the group already exists.
        if "BUSYGROUP" in str(exc):
            print(f"ℹ️ Consumer-group '{CONSUMER_GROUP}' already exists – continuing")
        else:
            raise


def decode_message(raw_fields: Dict[bytes, bytes]) -> Dict[str, Any]:
    """Convert byte-encoded stream fields into a Python dict with str keys."""
    decoded: Dict[str, Any] = {}
    for k, v in raw_fields.items():
        key = k.decode()
        value: Any
        try:
            value = json.loads(v)
        except (json.JSONDecodeError, TypeError):
            value = v.decode()
        decoded[key] = value
    return decoded


def main() -> None:
    client = connect_to_redis()
    if not client:
        # `connect_to_redis` already prints the error.
        return

    ensure_consumer_group(client)

    print(
        f"🚀 Replier running – group: '{CONSUMER_GROUP}', consumer: '{CONSUMER_NAME}', "
        f"stream: '{STREAM_NAME}'"
    )

    while True:
        try:
            response = client.xreadgroup(
                CONSUMER_GROUP,
                CONSUMER_NAME,
                {STREAM_NAME: ">"},
                count=10,
                block=BLOCK_MS,
            )
        except redis.ConnectionError as exc:
            print(f"❌ Redis connection error: {exc} – retrying in 5s")
            time.sleep(5)
            continue

        # ``response`` is [] when the BLOCK times out.
        if not response:
            continue

        for stream_name, messages in response:
            for message_id, raw_fields in messages:
                data = decode_message(raw_fields)
                action = data.get("action")
                sender = data.get("sender")
                print(
                    f"📨 Received action='{action}' from='{sender}' id={message_id} payload={data.get('payload')}"
                )

                # Dispatch simple acknowledgements / replies
                if action == "hello_world":
                    send_message(
                        client,
                        sender=CONSUMER_NAME,
                        action="hello_reply",
                        payload={"to": sender},
                    )
                elif action == "lock_shell":
                    payload = data.get("payload", {})
                    send_message(
                        client,
                        sender=CONSUMER_NAME,
                        action="lock_ack",
                        payload={"to": sender, **payload},
                    )
                elif action == "unlock_shell":
                    payload = data.get("payload", {})
                    send_message(
                        client,
                        sender=CONSUMER_NAME,
                        action="unlock_ack",
                        payload={"to": sender, **payload},
                    )
                else:
                    # Unknown / unhandled – just note it.
                    send_message(
                        client,
                        sender=CONSUMER_NAME,
                        action="unhandled_action",
                        payload={"original_action": action, "from": sender},
                    )

                # Acknowledge message so it is not delivered again.
                client.xack(STREAM_NAME, CONSUMER_GROUP, message_id)

        # Tight loop guard – small sleep to yield in cooperative environments.
        time.sleep(0.1)


if __name__ == "__main__":
    main() 