cd ~/rent_automation
sed -i 's/down_revision = None/down_revision = "522e9732dbbe"/' alembic/versions/20260227_add_user_id_to_tenants_units.py
./venv/bin/alembic upgrade head
cd frontend
npm install
npm run build
cd ..
pkill -f uvicorn
sleep 2
nohup ./venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 > err.log 2>&1 &
