{**}

{capture name=path}{l s='GoCoin payment.' mod='gocoin'}{/capture}
 
 {if $_show_breadcrumb== '1'}
            {include file="$tpl_dir./breadcrumb.tpl"}
 {/if}
<style type="text/css">
    #module-gocoin-payment #left_column {ldelim} display:none !important {rdelim}
    #module-gocoin-payment #center_column {ldelim} width:757px !important {rdelim}
</style>
 <h2>{l s='Unexpected payment error' mod='gocoin'}</h2>
<div class="error">
	<p><b>{l s='Unfortunately your order could not be processed at this time.' mod='gocoin'}</b></p>
 {if $_result eq 'error'}
	<ul style="margin-left: 30px;">
	 
		<li style='color: #ff0000;font-weight: bold;height: 163px !important;padding-bottom: 25px;'>
        {$_messages|escape:'htmlall':'UTF-8'}
    </li>
		<li> <span><a href="{$link->getPageLink('order', true, NULL, "step=3")|escape:'html'}" class="button_large">{l s='Other payment methods' mod='gocoin'}</a></span></li>
	</ul>
{/if}
</div>