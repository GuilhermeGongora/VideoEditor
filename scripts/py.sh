#!/usr/bin/env bash
# Usa o Python do ambiente da voz local (com GPU) se ele existir; senão, o python3 do sistema.
PY="${SCIENTIA_PY:-$HOME/.venvs/scientia/bin/python}"
[ -x "$PY" ] || PY=python3
exec "$PY" "$@"
