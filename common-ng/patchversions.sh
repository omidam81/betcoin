find ./ -name "api.dist.js" | xargs sed -i "s/liveapi\.betcoin\.tm/api.betcoin.tm/g"
3:07 #!/usr/bin/env bash

ROOTDIR=$PWD

git fetch > /dev/null
git branch -f master origin/master > /dev/null
GIT_VER=$(git describe master)
CURRENT_VERSION=${GIT_VER#v}
echo "Current version: $GIT_VER"

PATCH_VERSION=${CURRENT_VERSION##*.}
remaining=${CURRENT_VERSION%.$PATCH_VERSION}
MINOR_VERSION=${remaining##*.}
MAJOR_VERSION=${CURRENT_VERSION%.$MINOR_VERSION.$PATCH_VERSION}

# echo "Major: $MAJOR_VERSION"
# echo "Minor: $MINOR_VERSION"
# echo "Patch: $PATCH_VERSION"


echo "1) Major"
echo "2) Minor"
echo "3) Patch"

echo -n "Increment which? ";
read INCREMENT

case "$INCREMENT" in
    1) MAJOR_VERSION=$[ $MAJOR_VERSION + 1 ]; MINOR_VERSION=0; PATCH_VERSION=0;;
    2) MINOR_VERSION=$[ $MINOR_VERSION + 1 ]; PATCH_VERSION=0;;
    3) PATCH_VERSION=$[ $PATCH_VERSION + 1 ];;
esac

echo "New Version: $MAJOR_VERSION.$MINOR_VERSION.$PATCH_VERSION";