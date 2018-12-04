<div class="">
    {if $gocoin_validation}
        <div class="conf">
            {foreach from=$gocoin_validation item=validation}
                {$validation|escape:'htmlall':'UTF-8'}<br />
            {/foreach}
        </div>
    {/if}
    {if $gocoin_error}
        <div class="error">
            {foreach from=$gocoin_error item=error}
                {$error|escape:'htmlall':'UTF-8'}<br />
            {/foreach}
        </div>
    {/if}
    {if $gocoin_warning}
        <div class="info">
            {foreach from=$gocoin_warning item=warning}
                {$warning|escape:'htmlall':'UTF-8'}<br />
            {/foreach}
        </div>
    {/if}

    {if $php_version_allowed eq 'N'}
      <div class="error">
          <div style="color:#ff0000;font-weight: bold;"> The minimum PHP version required for GoCoin plugin is 5.3.0</div>
      </div>
    {else}
    <form action="" method="post" id="" class="half-form L">
        <input type="hidden" id="cid" value="{if $gocoin_configuration.GOCOIN_MERCHANT_ID}{$gocoin_configuration.GOCOIN_MERCHANT_ID|escape:'htmlall':'UTF-8'}{/if}"/>
        <input type="hidden" id="csec" value="{if $gocoin_configuration.GOCOIN_ACCESS_KEY}{$gocoin_configuration.GOCOIN_ACCESS_KEY|escape:'htmlall':'UTF-8'}{/if}"/>
        <fieldset>
            <legend><img src="{$module_dir}img/settings.gif" alt="" /><span>{l s='GoCoin API Settings' mod='gocoin'}</span></legend>
            <div id="">
                <label for="gocoin_merchant_id">{l s=' Client ID :' mod='gocoin'}</label></td>
                <div class="margin-form">
                    <input type="text" name="gocoin_merchant_id" id="gocoin_merchant_id" class="input-text" value="{if $gocoin_configuration.GOCOIN_MERCHANT_ID}{$gocoin_configuration.GOCOIN_MERCHANT_ID|escape:'htmlall':'UTF-8'}{/if}" />  
                </div>
                <label for="gocoin_access_key">{l s='Client Secret Key:' mod='gocoin'}</label></td>
                <div class="margin-form">
                    <input type="text" name="gocoin_access_key" id="gocoin_access_key" class="input-text" value="{if $gocoin_configuration.GOCOIN_ACCESS_KEY}{$gocoin_configuration.GOCOIN_ACCESS_KEY|escape:'htmlall':'UTF-8'}{/if}" />  
                </div>

                <label for="gocoin_token">{l s='Access Token:' mod='gocoin'}</label></td>
                <div class="margin-form">
                    <input type="text" name="gocoin_token" class="input-text" value="{if $gocoin_configuration.GOCOIN_TOKEN}{$gocoin_configuration.GOCOIN_TOKEN|escape:'htmlall':'UTF-8'}{/if}" /> <sup>*</sup>
                </div>
                 
                <script type="text/javascript">
                    var baseurl = '{$base_url}';
                    function get_api_token() {
                        var client_id = document.getElementById('gocoin_merchant_id').value;
                        var client_secret = document.getElementById('gocoin_access_key').value;
                        if (!client_id) {
                            alert('Please input Client ID!');
                            return;
                        }
                        if (!client_secret) {
                            alert('Please input Client Secret Key!');
                            return;
                        }
                        var cid = document.getElementById("cid").value;
                        var csec = document.getElementById("csec").value;
                        if (client_id != cid || client_secret != csec) {
                            alert("Please save changed Client Id and Client Secret Key first!");
                            return;
                        }

                        var currentUrl = baseurl + 'index.php?fc=module&module=gocoinpay&controller=create_token';
                        //alert(currentUrl);
                        var url = "https://dashboard.gocoin.com/auth?response_type=code"
                                + "&client_id=" + client_id
                                + "&scope=user_read+invoice_read_write"
                                + "&redirect_uri=" + encodeURIComponent(currentUrl);
                        var strWindowFeatures = "location=yes,height=570,width=520,scrollbars=yes,status=yes";
                        var win = window.open(url, "_blank", strWindowFeatures);
                        return;
                    }
                </script>
                <div style="margin-top:5px;"> 
                    <span class="notice">you can click button to get access token from gocoin.com</span>
                    <button id="btn_get_token" title="Get API Token" class="scalable " onclick="get_api_token();
                        return false;" style="">
                        <span><span><span>Get API Token</span></span></span>
                    </button>
                </div>
            </div>

            <div class="margin-form">
                <input type="submit" name="SubmitBasicSettings" class="button" value="{l s='Save settings' mod='gocoin'}" />
            </div>
            <span class="small"><sup style="color: red;">*</sup> {l s='Required fields' mod='gocoin'}</span>
        </fieldset>
    </form>
    {/if}    
</div>
