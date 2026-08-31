#!/bin/sh
# GitHub Pages dağıtımı: dist/ içeriğini gh-pages dalına zorla iter.
set -e
cd "$(dirname "$0")/.."
npm run build
cp dist/index.html dist/404.html
cd dist
rm -rf .git
git init -q -b gh-pages
git add -A
git -c user.email="omerozoglu001@gmail.com" -c user.name="Omer Raif Ozoglu" commit -q -m "deploy"
git push -f https://github.com/omeraif/ilk-nota.git gh-pages
echo "OK: https://omeraif.github.io/ilk-nota/"
