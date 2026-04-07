# content_forge

GRANT ALL ON SCHEMA public TO content_forge_user;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO content_forge_user;

GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO content_forge_user;

Mac backend % uvicorn app.main:app --reload --port 8000 

Mac backend python -m app.workers.celery_app

Mac frontend % npm run dev

