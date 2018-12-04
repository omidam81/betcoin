
# set PATH so it includes user's private bin if it exists
if [ "${PATH%%:*}" != "$HOME/bin" ]
then
    if [ -d "$HOME/bin" ]
    then
        PATH="$HOME/bin:$PATH"
    fi
fi

if [[ -r $HOME/.java_setup ]]
then
    . $HOME/.java_setup
fi
