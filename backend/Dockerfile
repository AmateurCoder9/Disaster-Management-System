FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Generate synthetic data and train model
RUN python data/generate_synthetic_data.py && \
    python -c "import sys; sys.path.insert(0, '.'); from app.ml.train_model import train; train()"

EXPOSE 5000

ENV FLASK_ENV=production
ENV SEED_DB=true

CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "run:app"]
