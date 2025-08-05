# Use official Python image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system-level dependencies (for Rust, dlib, rembg, etc.)
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    libgl1 \
    libglib2.0-0 \
    ffmpeg \
    cargo \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip setuptools wheel
RUN pip install -r requirements.txt

# Copy your application code
COPY . .

# Expose the port (adjust if needed)
EXPOSE 8000

# Run your app (adjust to your app's entry point)
CMD ["python", "app.py"]
