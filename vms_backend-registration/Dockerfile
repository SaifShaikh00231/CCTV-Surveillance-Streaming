# Use official Python image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system-level dependencies (Rust and build tools)
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    libgl1 \
    libglib2.0-0 \
    ffmpeg \
    cargo \
    git \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables for Rust builds (important!)
ENV CARGO_HOME=/tmp/cargo
ENV CRYPTOGRAPHY_DONT_BUILD_RUST=1

# Upgrade pip and install Python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip setuptools wheel
RUN pip install -r requirements.txt

# Copy application source code
COPY . .

# Expose the port your app runs on
EXPOSE 8000

# Default command to run your app
CMD ["python", "app.py"]
