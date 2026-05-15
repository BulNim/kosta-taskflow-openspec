"""apply-storyboard-wireframes 일회성 마이그레이션.

추가 컬럼:
  - users.current_team_id  (nullable FK -> teams.id)
  - tasks.assignee_id      (nullable FK -> users.id)
  - tasks.created_at       (DateTime, NOT NULL default now)

Postgres는 `ADD COLUMN IF NOT EXISTS`로 멱등. SQLite는 inspect로 사전 체크.
재실행 안전.

사용:
  # 로컬 SQLite
  python scripts/migrate.py

  # 운영 Neon (vercel env pull 후)
  DATABASE_URL="$(grep DATABASE_URL .env.local | cut -d= -f2- | tr -d '\"')" python scripts/migrate.py
"""

from __future__ import annotations

import os
import sys

from sqlalchemy import create_engine, inspect, text

DEFAULT_URL = "sqlite:///./taskflow.db"


def _is_postgres(url: str) -> bool:
    return url.startswith("postgresql") or url.startswith("postgres://")


def main() -> int:
    url = os.environ.get("DATABASE_URL", DEFAULT_URL)
    print(f"target: {url.split('@')[-1] if '@' in url else url}")

    engine_kwargs = {} if _is_postgres(url) else {"connect_args": {"check_same_thread": False}}
    engine = create_engine(url, **engine_kwargs)

    with engine.begin() as conn:
        if _is_postgres(url):
            stmts = [
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS current_team_id INTEGER REFERENCES teams(id) ON DELETE SET NULL",
                "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assignee_id INTEGER REFERENCES users(id) ON DELETE SET NULL",
                "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()",
                "CREATE INDEX IF NOT EXISTS ix_tasks_created_at ON tasks(created_at)",
            ]
            for stmt in stmts:
                print(f"  -> {stmt}")
                conn.execute(text(stmt))
        else:
            insp = inspect(engine)
            users_cols = {c["name"] for c in insp.get_columns("users")}
            tasks_cols = {c["name"] for c in insp.get_columns("tasks")}

            if "current_team_id" not in users_cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN current_team_id INTEGER REFERENCES teams(id)"))
                print("  + users.current_team_id added")
            if "assignee_id" not in tasks_cols:
                conn.execute(text("ALTER TABLE tasks ADD COLUMN assignee_id INTEGER REFERENCES users(id)"))
                print("  + tasks.assignee_id added")
            if "created_at" not in tasks_cols:
                conn.execute(text("ALTER TABLE tasks ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"))
                print("  + tasks.created_at added")

    print("migration complete.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
