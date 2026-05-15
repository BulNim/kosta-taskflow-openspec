"""로컬 스모크: 모델 임포트 + 테이블 생성 + 등록 라우트 + 스키마 컬럼 출력."""
from sqlalchemy import inspect

from backend.app.core.db import Base, engine
from backend.app.main import app
import backend.app.models  # noqa: F401

Base.metadata.create_all(bind=engine)

print("routes:")
for r in app.routes:
    if hasattr(r, "path") and hasattr(r, "methods"):
        methods = sorted(r.methods - {"HEAD"})
        print(" ", methods, r.path)

print("\nschema:")
insp = inspect(engine)
for tbl in ["users", "teams", "team_members", "tasks", "messages"]:
    try:
        cols = [c["name"] for c in insp.get_columns(tbl)]
        print("  " + tbl + ": " + ", ".join(cols))
    except Exception as e:
        print(f"  {tbl}: ERROR {e}")
