#!/usr/bin/env bash
ROOTDIR=$PWD

move_local () {
    LOCAL_CONF=$PWD/config/api.local.js
    if [[ -f  "$LOCAL_CONF" ]]
    then
        echo "Moving config file $LOCAL_CONF"
        mv "$LOCAL_CONF" "${LOCAL_CONF}.tmp"
    fi
}

restore_local () {
    LOCAL_CONF=$PWD/config/api.local.js
    if [[ -f  "${LOCAL_CONF}.tmp" ]]
    then
        echo "Restoring config file $LOCAL_CONF"
        mv "${LOCAL_CONF}.tmp" "$LOCAL_CONF"
    fi
}

echo -n "Release? "
read release
if [[ -n "$release" ]]
then
    for proj in common home circle dice dice-classic prize reels backoffice wiki press blog roulette war hilo blackjack fortune baccarat paigow coinflip sicbo keno
    do
        cd $ROOTDIR/$proj-ng
        git status;
        echo -n "repo: "
        echo -n $proj
        echo -n "... release?"
        read releasethis
        if [[ -n "$releasethis" ]]
        then
            echo "Last version"
            git fetch && git describe master
            echo -n "branch: "
            read branch
            echo -n "version: "
            read version
            git checkout dev && git pull origin dev && git checkout -b $branch-$version && vi package.json;
            git commit -am "package" && git push origin $branch-$version && \
                git checkout master && git pull origin master && \
                git merge --no-ff $branch-$version && git tag -a v$version -m "tag" && git push origin master && git push --tags && \
                git checkout dev && git merge --no-ff $branch-$version && git push origin dev;
            echo "Press ENTER key to continue"
            read foo
        fi
        cd $ROOTDIR
    done
fi
echo -n "Rebuild any sites? "
read rebuild
if [[ -n "$rebuild" ]]
then
    echo -n "Rebuild branch: master or dev? "
    read rebuildbranch
    echo -n "Run NPM install? "
    read npminstall
    cd $ROOTDIR/common-ng && git checkout $rebuildbranch && git pull origin $rebuildbranch
    for proj in common home circle dice dice-classic prize reels backoffice wiki press blog roulette war hilo blackjack fortune baccarat paigow coinflip sicbo keno
    do
        cd $ROOTDIR/$proj-ng;
        echo "---project status----";
        echo $proj;
        echo "-------";
        git status
        cd $ROOTDIR;
    done
    echo -n "Override per-repo switch?  "
    read buildall
    for proj in backoffice home circle dice dice-classic prize reels wiki press blog roulette war hilo blackjack fortune baccarat paigow coinflip sicbo keno
    do
        cd $ROOTDIR/$proj-ng;
        move_local
        git status;
        echo -n "repo: "
        echo -n $proj
        if [[ -z "$buildall" ]]
        then
            echo -n "... build?"
            read buildthis
        fi
        if [[ -n "$buildthis$buildall" ]]
        then
            git checkout $rebuildbranch && git pull origin $rebuildbranch&& \
                if [[ -n "$npminstall" ]]
                then
                    npm install
                fi
                npm install '../common-ng' && NODE_ENV=production grunt dist
            fi
            restore_local
        done

        cd $ROOTDIR
        echo -n "---rebuild chinese sites?-----"
        read buildch
        if [[ -n "$buildch" ]]
        then
            cd $ROOTDIR/home-ng && move_local && NODE_ENV=production grunt --loc zh_CN dist && restore_local
            cd $ROOTDIR/circle-ng && move_local && NODE_ENV=production grunt --loc zh_CN --base-href=lun dist && restore_local
            cd $ROOTDIR/dice-classic-ng && move_local && NODE_ENV=production grunt --loc zh_CN --base-href=ling-jingdian dist && restore_local
            cd $ROOTDIR/dice-ng && move_local && NODE_ENV=production grunt --loc zh_CN --base-href=ling dist && restore_local
            cd $ROOTDIR/prize-ng && move_local && NODE_ENV=production grunt --loc zh_CN --base-href=jiang dist && restore_local
            cd $ROOTDIR/reels-ng && move_local && NODE_ENV=production grunt --loc zh_CN --base-href=juan dist && restore_local
            cd $ROOTDIR/roulette-ng && move_local && NODE_ENV=production grunt --loc zh_CN --base-href=pan dist && restore_local
            cd $ROOTDIR/war-ng && move_local && NODE_ENV=production grunt --loc zh_CN --base-href=zhan dist && restore_local
            cd $ROOTDIR/sicbo-ng && move_local && NODE_ENV=production grunt --loc zh_CN --base-href=bao dist && restore_local
            cd $ROOTDIR/paigow-ng && move_local && NODE_ENV=production grunt --loc zh_CN --base-href=jiu dist && restore_local
            cd $ROOTDIR/hilo-ng && move_local && NODE_ENV=production grunt --loc zh_CN --base-href=gao dist && restore_local
            cd $ROOTDIR/blackjack-ng && move_local && NODE_ENV=production grunt --loc zh_CN --base-href=dian dist && restore_local
            cd $ROOTDIR/baccarat-ng && move_local && NODE_ENV=production grunt --loc zh_CN --base-href=le dist && restore_local
            cd $ROOTDIR/coinflip-ng && move_local && NODE_ENV=production grunt --loc zh_CN --base-href=fanzhuan dist && restore_local
            cd $ROOTDIR/fortune-ng && move_local && NODE_ENV=production grunt --loc zh_CN --base-href=yun dist && restore_local
            cd $ROOTDIR/keno-ng && move_local && NODE_ENV=production grunt --loc zh_CN --base-href=jinuo dist && restore_local


            cd $ROOTDIR
        fi
    fi
    echo -n "Package for distribution? "
    read package
    if [[ -n "$package" ]]
    then
        cd $ROOTDIR
        rm -rf $ROOTDIR/sitebuild-*.tar.gz;
        for proj in backoffice
        do
            tar czvf $ROOTDIR/sitebuild-$proj.tar.gz ./$proj-ng/build
        done
        for proj in home circle dice dice-classic prize reels wiki press blog roulette war hilo blackjack fortune baccarat paigow coinflip sicbo keno
        do
            tar czvf $ROOTDIR/sitebuild-$proj.tar.gz ./$proj-ng/dist
        done
        tar czvf $ROOTDIR/bc-frontend-package.tar.gz ./sitebuild-*.tar.gz
        rm ./sitebuild-*.tar.gz
    fi



