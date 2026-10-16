#!/usr/bin/env bash
# Instala a voz local (Chatterbox Multilingual, licença MIT) para rodar na GPU NVIDIA.
# Uso: bash scripts/setup-voz-local.sh     (uns 10 min; baixa ~3 GB entre PyTorch e o modelo)
set -e
cd "$(dirname "$0")/.."
command -v nvidia-smi >/dev/null && nvidia-smi --query-gpu=name,memory.total --format=csv,noheader || echo "aviso: nvidia-smi não encontrado (vai rodar na CPU, bem mais lento)"
sudo apt-get install -y python3-venv python3-dev ffmpeg >/dev/null
python3 -m venv "$HOME/.venvs/scientia"
PIP="$HOME/.venvs/scientia/bin/pip"
"$PIP" install -q --upgrade pip
"$PIP" install -q "setuptools<81" wheel
"$PIP" install -q chatterbox-tts edge-tts kokoro-onnx soundfile numpy
"$HOME/.venvs/scientia/bin/python" -c "import torch; print('PyTorch', torch.__version__, '· GPU:', torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'NÃO (CPU)')"
echo
echo "Pronto. Próximos passos:"
echo "  npm run vozes -- referencia        # cria marca/voz-feminina.wav e marca/voz-masculina.wav (Thalita/Antonio)"
echo "  npm run vozes -- local             # liga o Chatterbox no voz.json e gera amostras para ouvir"
echo "  (ou grave sua voz: 15–20 s, sem ruído, em marca/voz-minha.wav e rode: npm run vozes -- usar marca/voz-minha.wav masculina)"
