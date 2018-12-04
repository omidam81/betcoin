
nnoremap <Leader>q :nohlsearch<CR>

nnoremap <leader>h <C-w>5<
nnoremap <leader>l <C-w>5>
nnoremap <leader>j <C-w>5-
nnoremap <leader>k <C-w>5+

nnoremap <leader>ev :e $MYVIMRC<cr>
nnoremap <leader>sv :source $MYVIMRC<cr>
nnoremap <leader>ek :e $HOME/.vim/keybindings.vim<cr>

" remap <esc> and disable arrows
inoremap jk <esc>

" disable EX mode
nnoremap Q <nop>
" git mappings
nnoremap <leader>gf :Git fetch<cr>
nnoremap <leader>gs :Gstatus<cr>
nnoremap <leader>gu :Git push<cr>
nnoremap <leader>gl :Git log --decorate --oneline --graph --all<cr>

" switching for relative line numbers
function! NumberToggle()
    if (&relativenumber == 1)
        set norelativenumber
    else
        set relativenumber
    endif
endfunc

nnoremap <C-n> :call NumberToggle()<cr>

set pastetoggle=<F2>
" nnoremap <F2> :set invpaste<CR>

" special buffer delete
nnoremap <leader>x :Bdelete<cr>
nnoremap <leader>X :bdelete<cr>

" a subset of unimpaired, with modifications
nnoremap [q :cprevious<cr>
nnoremap ]q :cnext<cr>
nnoremap [Q :cfirst<cr>
nnoremap ]Q :clast<cr>
nnoremap [l :lprevious<cr>
nnoremap ]l :lnext<cr>
nnoremap [L :lfirst<cr>
nnoremap ]L :llast<cr>
nnoremap [b :bprevious<cr>
nnoremap ]b :bnext<cr>
nnoremap [B :bfirst<cr>
nnoremap ]B :blast<cr>
nnoremap [t :tabprevious<cr>
nnoremap ]t :tabnext<cr>
nnoremap [T :tabfirst<cr>
nnoremap ]T :tablast<cr>

" Unite.vim mappings
let g:unite_source_file_rec_max_cache_files=65535
call unite#custom#source('file_rec/async', 'ignore_pattern', '.*\(node_modules\|\.git\)/.*$')
nnoremap <leader>fs :Unite -start-insert -default-action=split file_rec/async<cr>
nnoremap <leader>fv :Unite -start-insert -default-action=vsplit file_rec/async<cr>
nnoremap <leader>fc :Unite -start-insert file_rec/async<cr>
nnoremap <leader>F :Unite file<cr>
nnoremap <leader>bs :Unite -start-insert -default-action=split buffer<cr>
nnoremap <leader>bv :Unite -start-insert -default-action=vsplit buffer<cr>
nnoremap <leader>bc :Unite -start-insert buffer<cr>
nnoremap <leader>s :Unite grep:.<cr>
nnoremap <leader>t :Unite -start-insert tag<cr>

" use unite to search help
nnoremap <F1> :Unite -start-insert help<cr>
