{if $gocoin_order.valid == 1}
<div class="conf confirmation">
	{l s='Congratulations! Your order has been saved under' mod='gocoinpay'}{if isset($gocoin_order.reference)} {l s='the reference' mod='gocoinpay'} <b>{$gocoin_order.reference|escape:html:'UTF-8'}</b>{else} {l s='the ID' mod='gocoinpay'} <b>{$gocoin_order.id|escape:html:'UTF-8'}</b>{/if}.
</div>
{else}
<div class="conf confirmation">
	{l s='Awaiting Payment Confirmation from GoCoin.' mod='gocoinpay'}<br /><br />
{if isset($gocoin_order.reference)}
	({l s='Your Order\'s Reference:' mod='gocoinpay'} <b>{$gocoin_order.reference|escape:html:'UTF-8'}</b>)
{else}
	({l s='Your Order\'s ID:' mod='gocoinpay'} <b>{$gocoin_order.id|escape:html:'UTF-8'}</b>)
{/if}
</div>
{/if}
