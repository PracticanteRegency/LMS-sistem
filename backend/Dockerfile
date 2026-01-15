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
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY requirements-dev.txt .
RUN pip install --upgrade pip && pip install -r requirements-dev.txt

COPY . .

EXPOSE 8000