#!/usr/bin/env bash


DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
# add ppas
add-apt-repository -y ppa:chris-lea/node.js
add-apt-repository -y ppa:bitcoin/bitcoin
#docker
wget -qO- https://get.docker.io/gpg | apt-key add -
echo 'deb http://get.docker.io/ubuntu docker main' > /etc/apt/sources.list.d/docker.list

apt-get update && apt-get -y dist-upgrade

apt-get -y install git zsh build-essential libncurses{,w}5{,-dev} mercurial python{,3}{,-dev} vim-runtime curl psutils bitcoind nodejs lxc-docker automake pkg-config libevent-dev tree htop ntp

# dotfiles setup for skel folder so all new users will have them
for dir in /root /etc/skel
do
    cd $dir
    for file in zshrc zsh zprofile toprc tmux.conf vim gitconfig zshenv
    do
        cp -r $DIR/dotfiles/$file $dir/.$file
    done
done

# get sources for vim
rootSrcDir=/root/src
mkdir $rootSrcDir
git clone git://git.code.sf.net/p/tmux/tmux-code $rootSrcDir/tmux
hg clone https://vim.googlecode.com/hg/ $rootSrcDir/vim

# build tmux
cd $rootSrcDir/tmux
git checkout 1.9
sh autogen.sh && ./configure && make && make install

# build vim
cd $rootSrcDir/vim
./configure --with-features=huge --enable-python{,3}interp=yes --with-python-config-dir=/usr/lib/python2.7/config --with-python3-config-dir=/usr/lib/python3.2/config && make && make install
update-alternatives --install /usr/bin/vi vi /usr/local/bin/vim 99
update-alternatives --install /usr/bin/vim vim /usr/local/bin/vim 99
update-alternatives --install /usr/bin/editor editor /usr/local/bin/vim 99

cd

chsh -s $(which zsh)

useradd -m -s $(which zsh) -G docker betcoin

echo 'DOCKER_OPTS="--restart=false --storage-driver="devicemapper"' >> /etc/default/docker
