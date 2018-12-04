ROOTDIR=$PWD

echo -n "Release? "
read release
if [ -n "$release" ]
    then
    for proj in common home circle dice prize backoffice supportadmin wiki press blog
    do
        cd $ROOTDIR/$proj-ng
        git status;
        echo -n "repo: "
        echo -n $proj
        echo -n "... release?"
        read releasethis
        if [ -n "$releasethis" ]
            then
            git fetch && git tag
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
if [ -n "$rebuild" ]
    then
    echo -n "Rebuild branch: master or dev? "
    read rebuildbranch
    echo -n "Run NPM install? "
    read npminstall
    cd $ROOTDIR/common-ng && git checkout $rebuildbranch && git pull

    for proj in common home circle dice prize backoffice supportadmin wiki press blog
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
    for proj in backoffice wiki press blog supportadmin
    do
        cd $ROOTDIR/$proj-ng;
        git status;
        echo -n "repo: "
        echo -n $proj
        if [ -z "$buildall" ]
            then
            echo -n "... build?"
            read buildthis
        fi
        if [ -n "$buildthis$buildall" ]
            then
            git checkout $rebuildbranch && git pull && \
            if [ -n "$npminstall" ]
                then
                npm install
            fi
            npm install '../common-ng' && NODE_ENV=production grunt
        fi
    done
    for proj in home circle dice prize
    do
        cd $ROOTDIR/$proj-ng;
        git status;
        echo -n "repo: "
        echo -n $proj
        if [ -z "$buildall" ]
            then
            echo -n "... build?"
            read buildthis
        fi
        if [ -n "$buildthis$buildall" ]
            then
            git checkout $rebuildbranch && git pull && \
            if [ -n "$npminstall" ]
                then
                npm install
            fi
            npm install '../common-ng' && NODE_ENV=production grunt dist
        fi
    done

    cd $ROOTDIR
    if [ -z "$buildall" ]
    then
        echo -n "---rebuild chinese sites?-----"
        read buildch
    fi
    if [ -n "$buildch" ]
        then
        cd $ROOTDIR/home-ng && NODE_ENV=production grunt --loc zh_CN dist
        cd $ROOTDIR/circle-ng && NODE_ENV=production grunt --loc zh_CN --base-href=lun dist
        cd $ROOTDIR/dice-ng && NODE_ENV=production grunt --loc zh_CN --base-href=ling dist
        cd $ROOTDIR/prize-ng && NODE_ENV=production grunt --loc zh_CN --base-href=jiang dist
        cd $ROOTDIR
    fi
fi
echo -n "Package for distribution? "
read package
if [ -n "$package" ]
    then
    cd $ROOTDIR
    rm -rf $ROOTDIR/sitebuild-*.tar.gz;
    for proj in backoffice supportadmin wiki press blog
    do
        tar czvf $ROOTDIR/sitebuild-$proj.tar.gz ./$proj-ng/build
    done
    for proj in home circle dice prize
    do
        tar czvf $ROOTDIR/sitebuild-$proj.tar.gz ./$proj-ng/dist
    done
    tar czvf $ROOTDIR/bc-frontend-package.tar.gz ./sitebuild-*.tar.gz
    rm ./sitebuild-*.tar.gz
fi



