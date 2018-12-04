#!/usr/bin/env bash

for LOC in $(ls $PWD/build)
do
    for file in $(find $PWD/build/$LOC/home)
    do
        if [[ ! -d "$file" ]]
        then
            for prod in $(ls build/$LOC)
            do
                if [[ $prod != "home" ]]
                then
                    compfile=${file/$LOC\/home/$LOC\/$prod}
                    if [[ -f "$compfile" ]]
                    then
                        filehash="$(sha256sum < $file)"
                        comphash="$(sha256sum < $compfile)"
                        if [[ "$filehash" == "$comphash" ]]
                        then
                            echo "$file $filehash"
                            echo "$compfile $comphash"
                            rm $compfile
                            ln -s $file $compfile
                        fi
                    fi
                fi
            done
        fi
    done
done


