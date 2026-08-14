"""
Pinecone maintenance for a clean rebuild.

    python scripts/reset_pinecone.py --list         what is in the index
    python scripts/reset_pinecone.py --delete-all   wipe every namespace
    python scripts/reset_pinecone.py --audit        check metadata completeness

Reads AI_PINECONE_HOST and AI_PINECONE_API_KEY from .env.local.
"""
import argparse
import json
import sys
import urllib.error
import urllib.request
from pathlib import Path

ENV = Path(__file__).resolve().parent.parent / ".env.local"


def load_env():
    if not ENV.exists():
        sys.exit(f"Not found: {ENV}")
    env = {}
    for line in ENV.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip().strip('"').strip("'")
    for key in ("AI_PINECONE_HOST", "AI_PINECONE_API_KEY"):
        if not env.get(key):
            sys.exit(f"{key} is not set in .env.local")
    return env["AI_PINECONE_HOST"], env["AI_PINECONE_API_KEY"]


HOST, KEY = load_env()


def call(path, payload):
    req = urllib.request.Request(
        f"https://{HOST}{path}",
        data=json.dumps(payload).encode(),
        headers={"Api-Key": KEY, "Content-Type": "application/json"})
    try:
        return json.loads(urllib.request.urlopen(req, timeout=60).read() or b"{}")
    except urllib.error.HTTPError as e:
        sys.exit(f"Pinecone {path} failed: HTTP {e.code}\n{e.read().decode()[:400]}")


def stats():
    return call("/describe_index_stats", {})


def show():
    d = stats()
    namespaces = d.get("namespaces") or {}
    print(f"index    {HOST}")
    print(f"vectors  {d.get('totalVectorCount', 0)}")
    print(f"dims     {d.get('dimension')}\n")
    if not namespaces:
        print("  (empty)")
    for ns, info in sorted(namespaces.items()):
        print(f"  {ns or '(default)':<16} {info.get('vectorCount', 0):>6} vectors")
    return namespaces


def delete_all():
    namespaces = show()
    if not namespaces:
        print("\nNothing to delete.")
        return

    total = sum(i.get("vectorCount", 0) for i in namespaces.values())
    print(f"\nThis deletes ALL {total} vectors across {len(namespaces)} namespace(s).")
    if input("Type DELETE to confirm: ").strip() != "DELETE":
        print("Cancelled.")
        return

    for ns in sorted(namespaces):
        call("/vectors/delete", {"deleteAll": True, "namespace": ns})
        print(f"  cleared {ns}")

    print("\nAfter deletion:")
    remaining = stats().get("totalVectorCount", 0)
    print(f"  total: {remaining}")
    if remaining:
        print("  Pinecone deletes are eventually consistent; re-run --list shortly.")


def audit():
    """Samples each namespace and reports metadata completeness."""
    namespaces = stats().get("namespaces") or {}
    if not namespaces:
        print("Index is empty.")
        return

    dim = stats().get("dimension", 1024)
    required = ["connectorType", "recordNumber", "recordSysId", "title"]
    seen = 0
    have = {k: 0 for k in required}
    connectors = {}

    for ns in sorted(namespaces):
        matches = call("/query", {
            "vector": [0.01] * dim, "topK": 100,
            "namespace": ns, "includeMetadata": True}).get("matches", [])
        for m in matches:
            meta = m.get("metadata") or {}
            seen += 1
            for k in required:
                if meta.get(k):
                    have[k] += 1
            ct = meta.get("connectorType", "(missing)")
            connectors[ct] = connectors.get(ct, 0) + 1

    print(f"sampled {seen} vectors across {len(namespaces)} namespace(s)\n")
    print("metadata completeness")
    for k in required:
        pct = (have[k] * 100 // seen) if seen else 0
        flag = "ok  " if pct == 100 else "GAP "
        print(f"  {flag} {k:<14} {have[k]:>4}/{seen}  {pct}%")

    print("\nby source")
    for ct, n in sorted(connectors.items(), key=lambda x: -x[1]):
        print(f"  {ct:<16} {n:>4}")

    if any(have[k] < seen for k in required):
        print("\nA gap here means a write path is dropping metadata. Citations and the")
        print("source filter will be unreliable for those vectors.")


parser = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
group = parser.add_mutually_exclusive_group(required=True)
group.add_argument("--list", action="store_true", help="show namespaces and counts")
group.add_argument("--delete-all", action="store_true", help="wipe every namespace")
group.add_argument("--audit", action="store_true", help="check metadata completeness")

args = parser.parse_args()
if args.list:
    show()
elif args.delete_all:
    delete_all()
else:
    audit()
