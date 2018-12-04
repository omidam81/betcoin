#!/usr/bin/env bash

# add ppas
add-apt-repository -y ppa:chris-lea/node.js
add-apt-repository -y ppa:bitcoin/bitcoin
#mongo
apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10
echo 'deb http://downloads-distro.mongodb.org/repo/ubuntu-upstart dist 10gen' > /etc/apt/sources.list.d/mongodb.list
#docker
wget -qO- https://get.docker.io/gpg | apt-key add -
echo 'deb http://get.docker.io/ubuntu docker main' > /etc/apt/sources.list.d/docker.list

apt-get update && apt-get -y dist-upgrade

apt-get -y install git zsh build-essential libncurses{,w}5{,-dev} mercurial python{,3}{,-dev} vim-runtime curl psutils mongodb-10gen bitcoind nodejs lxc-docker automake pkg-config libevent-dev tree htop

#clone dotfiles repo
git clone --recursive https://github.com/paulbdavis/dotcli.git /root/.dotfiles
git clone --recursive https://github.com/dangersalad/vim.git /root/.vim
cp -r /root/.dotfiles /etc/skel
cp -r /root/.vim /etc/skel

# dotfiles setup for skel folder so all new users will have them
for dir in /root /etc/skel
do
    cd $dir
    for file in zshrc zsh zprofile toprc tmux.conf
    do
        ln -s .dotfiles/$file $dir/.$file
    done
    sed '1,3d' .dotfiles/gitconfig > $dir/.gitconfig

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
