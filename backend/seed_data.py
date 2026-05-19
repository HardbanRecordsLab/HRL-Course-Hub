import psycopg2
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://hbrl_admin:HardbanRecordsLab2026!@localhost:5432/hbrl_master")

def seed_subscription_plans():
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    plans = [
        ("starter", "Starter", 9700, "PLN", "month", '{"courses": 1, "support": "email"}'),
        ("pro", "Pro", 29700, "PLN", "month", '{"courses": 5, "support": "priority", "certificates": true}'),
        ("all-access", "All Access", 49700, "PLN", "month", '{"courses": -1, "support": "priority", "certificates": true, "api": true}'),
        ("vip", "VIP", 99700, "PLN", "month", '{"courses": -1, "support": "24/7", "certificates": true, "api": true, "white_label": true}'),
    ]
    for p in plans:
        cur.execute(
            "INSERT INTO subscription_plans (id, name, price_cents, currency, period, features) VALUES (%s,%s,%s,%s,%s,%s) ON CONFLICT (id) DO NOTHING",
            p
        )
    conn.commit()
    cur.execute("SELECT count(*) FROM subscription_plans")
    count = cur.fetchone()[0]
    cur.close()
    conn.close()
    return count

def seed_admin_user():
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    cur.execute("SELECT id FROM users WHERE email = 'admin@hardbanrecordslab.online'")
    if not cur.fetchone():
        import uuid
        cur.execute(
            "INSERT INTO users (id, email, full_name, tier, is_premium, is_superuser, username, is_active) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)",
            (str(uuid.uuid4()), "admin@hardbanrecordslab.online", "Admin HRL", "admin", True, True, "admin", True)
        )
        conn.commit()
        print("Admin user created")
    else:
        print("Admin user already exists")
    cur.execute("SELECT count(*) FROM users")
    count = cur.fetchone()[0]
    cur.close()
    conn.close()
    return count

if __name__ == "__main__":
    plans = seed_subscription_plans()
    print(f"Subscription plans: {plans}")
    users = seed_admin_user()
    print(f"Total users: {users}")
