#!/usr/bin/env bash

cd `dirname $0`
wget "https://huggingface.co/Mozilla/llava-v1.5-7b-llamafile/resolve/main/llava-v1.5-7b-q4.llamafile?download=true" --output-document=llava.llamafile
chmod +x llava.llamafile




