#!/usr/bin/env bash
cd ~/live-test
rm -rf *
scp betcoin@frontdev.betcoin.tm:bc-frontend-package.tar.gz ./
tar xzvf ./bc-frontend-package.tar.gz ./
rm bc-frontend-package.tar.gz
for prod in blog dice dice-classic circle home press prize reels wiki roulette war; do tar xzvf ./sitebuild-$prod.tar.gz ./; done;
rm -rf *.tar.gz
cd ~/live-ng
rm -rf blog-ng circle-ng dice-classic-ng dice-ng home-ng press-ng prize-ng wiki-ng reels-ng roulette-ng war-ng && cp -r ../live-test/* .