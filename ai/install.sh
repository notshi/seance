#!/usr/bin/env bash

# first install a require script
if ! [[ -x "$(command -v require.sh)" ]] ; then

        echo " we need sudo to install require.sh to /usr/local/bin "
        sudo wget -O /usr/local/bin/require.sh https://raw.githubusercontent.com/xriss/require.sh/main/require.sh
        sudo chmod +x /usr/local/bin/require.sh

fi

# commands

require.sh git
require.sh clang
require.sh gcc
require.sh make
require.sh luajit
require.sh patchelf
require.sh zip


# build llama.cpp

rm -rf llama.cpp
git clone git@github.com:ggerganov/llama.cpp.git
cd llama.cpp
make
cd ..


# copy model

mkdir gguf
cd gguf
smbget -u -U "kriss" smb://192.168.1.221/nixdata/ai/mistral-7b-openorca.Q4_K_M.gguf
cd ..


