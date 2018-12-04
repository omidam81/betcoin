{**}

{capture name=path}{l s='GoCoin payment.' mod='gocoin'}{/capture}
 
 {if $_show_breadcrumb== '1'}
            {include file="$tpl_dir./breadcrumb.tpl"}
 {/if}
<style type="text/css">
    #module-gocoin-payment #left_column {ldelim} display:none !important {rdelim}
    #module-gocoin-payment #center_column {ldelim} width:757px !important {rdelim}
</style>
<h2>{l s='Order summary' mod='gocoin'}</h2>

{assign var='current_step' value='payment'}
{include file="$tpl_dir./order-steps.tpl"}

{if $nbProducts <= 0}
    <p class="warning">{l s='Your shopping cart is empty.' mod='gocoin'}</p>
{else}

  <!--  <h3>{l s='GoCoin payment.' mod='gocoin'}</h3>-->

    <p>
        <img src="{$this_path_bw}logo.png" alt="{l s='GoCoin' mod='gocoin'}" width="86" height="49" style="float:left; margin: 0px 10px 5px 0px;" />
        {l s='You have chosen to pay by GoCoin Payment Gateway.' mod='gocoin'}
        <br/><br />
        {l s='Here is a short summary of your order:' mod='gocoin'}
    </p>
    <p style="margin-top:20px;">
        - {l s='The total amount of your order is' mod='gocoin'}
        <span id="amount" class="price">{displayPrice price=$total}</span>
        {if $use_taxes == 1}
            {l s='(tax incl.)' mod='gocoin'}
        {/if}
    </p>

    <table width='100%'>
        <tr>
            <td valign="top" class="cart_navigation" id="cart_navigation">
               <a href="{$link->getPageLink('order', true, NULL, "step=3")|escape:'html'}" class="button_large">{l s='Other payment methods' mod='gocoin'}</a>
            </td>
            <td valign="top">
                {if $_result eq 'success'}
                    {if $_result != ''}
                        <form name="payform" method="post" action="{$_payformaction}" > 
                        <input type='hidden' name='gurl' value="{$_redirect}" >  
                        <input type="submit" class="exclusive_large" value="{l s='Place my order' mod='gocoin'}" >
                      </form>  
                    {/if}    
                {/if}
            </td>
        </tr>    
    </table>
{/if}
