FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DJANGO_SETTINGS_MODULE=core.config.dev

WORKDIR /app

RUN apt-get update && apt-get install -y \
    build-essential \
    pkg-config \
    default-libmysqlclient-dev \
    pandoc \
    texlive-xetex \
    texlive-latex-recommended \
    libpango-1.0-0 \
    libpango1.0-dev \
    libcairo2 \
    libcairo2-dev \
    libffi-dev \
    libjpeg-dev \
    libpng-dev \
    libfreetype6-dev \
    fonts-liberation \
    fontconfig \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY requirements-dev.txt .
RUN pip install --upgrade pip && pip install -r requirements-dev.txt

COPY . .

EXPOSE 8000