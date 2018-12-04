" use Vim settings only
set nocompatible

source ~/.vim/neobundle.vim

source ~/.vim/keybindings.vim

" ============ Basic Settings ================ {{{

" set number                 " line numbers
set number
set relativenumber                 " line numbers
set backspace=indent,eol,start        " allow backspace in insert mode
set history=1000
set noshowcmd                " show incomplete commands at the bottom
set noshowmode                " show mode at the bottom
set autoread                " read outside changes
set ttimeoutlen=50

set scrolloff=10

set hidden                 " allow buffers in the background

" folders
silent execute '!mkdir -p $HOME/.vim/tmp/{backup,swap,view,undo}'
set backupdir=$HOME/.vim/tmp/backup/
set backup
set directory=$HOME/.vim/tmp/swap/
set viewdir=$HOME/.vim/tmp/view/
set undodir=$HOME/.vim/tmp/undo/
" store undo files, undo edits after deleting a buffer
set undofile
set viminfo='50,n$HOME/.vim/tmp/viminfo
" syntax, duh
syntax on

" search settings
set incsearch         " finds match as search is typed
set hlsearch          " highlighs search

" Display tabs and trailing spaces visually
set list listchars=tab:→\ ,trail:·,extends:»,precedes:«

" set nowrap "Don't wrap lines
set linebreak "Wrap lines at convenient points
set showbreak=↪
set textwidth=79
set formatoptions=qcrnl
" set colorcolumn=80
set splitright splitbelow

" set shortmess+=afilmnrxoOtTI
set shortmess+=I

set guifont=DejaVu\ Sans\ Mono\ 8
set guioptions=aci
set guiheadroom=0

if filereadable(getcwd() . "/.git/tags")
    let &tags=getcwd()."/.git/tags"
endif

" autocmd BufWinLeave * silent! mkview
" autocmd BufWinEnter * silent! loadview
" }}}

" ================ Indentation ====================== {{{

set autoindent
set smartindent
set smarttab
set shiftwidth=4
set softtabstop=4
set tabstop=4
set expandtab


filetype plugin on
filetype indent on

" }}}

"==================== Functions ============ {{{

" a function to run things silently
command! -nargs=1 Silent
\ | execute ':silent !'.<q-args>
\ | execute ':redraw!'

" function to run shell output to scratch buffer
function! g:DSExecuteInShell(command)
  let command = join(map(split(a:command), 'expand(v:val)'))
  let winnr = bufwinnr('^' . command . '$')
  silent! execute  winnr < 0 ? 'botright new ' . fnameescape(command) : winnr . 'wincmd w'
  setlocal buftype=nowrite bufhidden=wipe nobuflisted noswapfile nowrap nonumber norelativenumber
  echo 'Execute ' . command . '...'
  silent! execute 'silent %!'. command
  silent! execute 'resize ' . line('$')
  silent! redraw
  silent! execute 'au BufUnload <buffer> execute bufwinnr(' . bufnr('#') . ') . ''wincmd w'''
  silent! execute 'nnoremap <silent> <buffer> <LocalLeader>r :call <SID>DSExecuteInShell(''' . command . ''')<CR>'
  silent! execute 'nnoremap <silent> <buffer> q :q<CR>'
  silent! execute 'nnoremap <silent> <buffer> <esc> :q<CR>'
  echo 'Shell command ' . command . ' executed.'
endfunction
command! -complete=shellcmd -nargs=+ Shell call g:DSExecuteInShell(<q-args>)

" }}}

" ================= Custom Cursor =========== {{{

" if empty($TMUX)
"     if &term =~ "xterm\\|rxvt"
"         " in insert mode
"         let &t_SI = "\<Esc>]12;lightblue\x7"
"         " otherwise
"         let &t_EI = "\<Esc>]12;grey\x7"
"         silent !echo -ne "\033]12;grey\007"
"         " reset cursor when vim exits
"         autocmd VimLeave * silent !echo -ne "\033]112\007"
"         " use \003]12;gray\007 for gnome-terminal
"     endif

"     if &term =~ '^xterm'
"         " 1 or 0 -> blinking block
"         " 2 solid block
"         " 3 -> blinking underscore
"         " 4 solid underscore
"         " Recent versions of xterm (282 or above) also support
"         " 5 -> blinking vertical bar
"         " 6 -> solid vertical bar
"         let &t_SI .= "\<Esc>[6 q"
"         let &t_EI .= "\<Esc>[2 q"
"     endif
" endif

" }}}

" =========== Plugin Config ================= {{{

" supertab settings
let g:SuperTabDefaultCompletionType = "context"
let g:SuperTabNoCompleteAfter = ['^', ',', '"', '\s', "'"]

" java
let no_java_maps=1

" airline
if !exists('g:airline_symbols')
    let g:airline_symbols = {}
endif
" let g:airline_left_sep=''
" let g:airline_right_sep=''
" let g:airline_left_alt_sep = '|'
" let g:airline_right_alt_sep = '|'
" let g:airline_symbols.linenr = '¶'
let g:airline_powerline_fonts = 1
let g:airline_theme='zenburn'
let g:airline#extensions#tabline#enabled = 1

function! AirlineInit()
    let g:airline_section_a = airline#section#create_left(['mode', 'paste', 'iminsert'])
    let g:airline_section_b = airline#section#create(['hunks', 'branch'])
    let g:airline_section_c = airline#section#create_left(['file', 'filetype'])
    let g:airline_section_x = airline#section#create(['readonly', ' ', 'ffenc'])
    let g:airline_section_y = airline#section#create(['%P'])
    let g:airline_section_z = airline#section#create(['linenr', ':%c'])
endfunction
autocmd VimEnter * call AirlineInit()

" closetag plugin for html, xml, etc
augroup close_tag_plugin
    autocmd!
    autocmd FileType html,htmldjango,jinjahtml,eruby,mako let b:closetag_html_style=1
    autocmd FileType html,xhtml,xml,htmldjango,jinjahtml,eruby,mako source ~/.vim/closetag/plugin/closetag.vim
augroup END

" syntastic settings
let g:syntastic_always_populate_loc_list=1



" indentLine settings
let g:indentLine_color_term = 237
let g:indentLine_color_gui = '#3a3a3a'
let g:indentLine_char = '│'

" git gutter settings
" let g:gitgutter_sign_column_always = 1

" signify settings
let g:signify_vcs_list = [ 'git', 'hg', 'svn' ]

" }}}

" highlighting {{{
augroup highlighting
    autocmd!
    autocmd ColorScheme * hi MatchParen cterm=bold ctermbg=black ctermfg=green
    " highlighing for SignColumn
    autocmd ColorScheme * hi SignColumn ctermbg=235
    autocmd ColorScheme * hi CursorLineNr ctermfg=green
    autocmd ColorScheme * hi TabLine ctermfg=240 ctermbg=235
    autocmd ColorScheme * hi TabLineFill ctermbg=235
    autocmd ColorScheme * hi TabLineSel ctermfg=green ctermbg=233
    " autocmd ColorScheme * hi GitGutterAdd ctermbg=235 ctermfg=green
    " autocmd ColorScheme * hi GitGutterChange ctermbg=235 ctermfg=yellow
    " autocmd ColorScheme * hi GitGutterChangeDelete ctermbg=235 ctermfg=red
    " autocmd ColorScheme * hi GitGutterDelete ctermbg=235 ctermfg=red
    autocmd ColorScheme * hi SignifySignAdd ctermbg=235 ctermfg=green
    autocmd ColorScheme * hi SignifySignCHange ctermbg=235 ctermfg=yellow
    autocmd ColorScheme * hi SignifySignDelete ctermbg=235 ctermfg=red

    "highlight for status bar
    autocmd ColorScheme * hi User1 ctermbg=235 ctermfg=red    guibg=#262626 guifg=red
    autocmd ColorScheme * hi User2 ctermbg=235 ctermfg=blue   guibg=#262626 guifg=blue
    autocmd ColorScheme * hi User3 ctermbg=235 ctermfg=green  guibg=#262626 guifg=green
    autocmd ColorScheme * hi User4 ctermbg=235 ctermfg=yellow  guibg=#262626 guifg=yellow
    autocmd ColorScheme * hi User5 ctermbg=235 ctermfg=lightgray  guibg=#262626 guifg=lightgray
augroup END
" }}}

" file specifice auto cmds {{{
set foldmethod=indent foldlevelstart=99 foldlevel=99

augroup file_specific
    autocmd!
    autocmd FileType vim setlocal foldmethod=marker foldlevelstart=0 foldlevel=0
    autocmd BufRead,BufNewFile *.qml set filetype=qml
    autocmd BufRead,BufNewFile *.less set filetype=less
augroup END
" }}}

" status bar {{{
set statusline=%5*(%n)\ %3*%.40f
set statusline+=\ %1*%h%m%r%w
set statusline+=\ %{SyntasticStatuslineFlag()}
set statusline+=%=
set statusline+=%5*%4l/%-5L
set statusline+=%1*%y%4*[%{strlen(&fenc)?&fenc:&enc}, " encoding
set statusline+=%{&fileformat}]              " file format
set statusline+=%2*
set statusline+=%{fugitive#statusline()}
set laststatus=2
" }}}

" use zenburn theme {{{
" only if running in xterm, looks like shit on a tty
if $TERM == "linux"
    colorscheme vividchalk
else
    set t_Co=256
    " if tmux is running, fix the background colors
    if !empty($TMUX)
        set t_ut=
    endif
    let g:zenburn_high_Contrast=1
    let g:zenburn_force_dark_Background = 1
    let g:zenburn_unified_CursorColumn = 1
    colorscheme zenburn
endif

if filereadable('project.vim')
    source project.vim
endif
" }}}
