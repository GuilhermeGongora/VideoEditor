#!/usr/bin/env bash
set -e

# ffmpeg (converter clipes) + bibliotecas que o Chrome headless do Remotion precisa
sudo apt-get update
sudo apt-get install -y --no-install-recommends \
  ffmpeg fonts-noto-color-emoji fonts-dejavu-core \
  libnss3 libdbus-1-3 libatk1.0-0 libatk-bridge2.0-0 libgbm1 libasound2 \
  libxrandr2 libxkbcommon0 libxfixes3 libxcomposite1 libxdamage1 libcups2 \
  libpango-1.0-0 libcairo2

npm install

# Baixa o Chrome headless do Remotion agora (pra não travar no primeiro render)
npx remotion browser ensure || true

# Efeitos sonoros básicos (sem API)
npm run sfx
npm run sfx:index || true

# Claude Code no terminal
npm install -g @anthropic-ai/claude-code || true

echo ""
echo "Pronto! Coloque os clipes em clips/ e rode: claude"
