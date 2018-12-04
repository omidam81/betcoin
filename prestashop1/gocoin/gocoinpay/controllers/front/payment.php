<?php
include_once _PS_CLASS_DIR_ . 'gocoinlib/src/GoCoin.php';
class GocoinpayPaymentModuleFrontController extends ModuleFrontController {
    public $ssl = true;
    /**
     * @see FrontController::initContent()
     */
    public function initContent() {
        $this->display_column_left = false;
        parent::initContent();
        $gocoin = new Gocoinpay();

        $cart = $this->context->cart;
        $ssl = Configuration::get('PS_SSL_ENABLED')?true:null;
        $error_log_path =  _PS_ROOT_DIR_.'/log/gocoin_error.log';
        $errorlog       = '';
        
        if (!$this->module->checkCurrency($cart))
            Tools::redirect($this->context->link->getPageLink('order.php', ''));
        $merchant_id                = Configuration::get('GOCOIN_MERCHANT_ID');
        $gocoin_access_key          = Configuration::get('GOCOIN_ACCESS_KEY');
        $gocoin_token               = Configuration::get('GOCOIN_TOKEN');
        $gocoin_url                 = Configuration::get('GOCOIN_URL');

        $currency                   = new Currency((int) $this->context->cart->id_currency);
        $cart                       = $this->context->cart;
        $billing_customer           = $this->context->customer;
        $billing_address            = new Address((int) $this->context->cart->id_address_invoice);
        $billing_address->country   = new Country((int) $billing_address->id_country);
        $billing_address->state     = new State((int) $billing_address->id_state);

        $data = array();
        $data['currency_code']      = urlencode($currency->iso_code);
        $data['name']               = $billing_customer->firstname . " " . $billing_customer->lastname;
        $data['address1']           = $billing_address->address1;
        $data['address2']           = $billing_address->address2;
        $data['city']               = $billing_address->city;
        $data['state']              = $billing_address->state->name;
        $data['zip']                = $billing_address->postcode;
        $data['country']            = $billing_address->country->iso_code;
        $data['email']              = $billing_customer->email;

        if (isset($billing_address->phone_mobile) && !empty($billing_address->phone_mobile)) {
            $data['day_phone_b']    = $billing_address->phone_mobile;
        } elseif (isset($billing_address->phone) && !empty($billing_address->phone)) {
            $data['day_phone_b']    = $billing_address->phone;
        }

        $price_currency = isset($_POST['paytype']) && !empty($_POST['paytype']) ? $_POST['paytype'] : '';
        if ($price_currency == '') {
            Tools::redirect($this->context->link->getPageLink('order.php', $ssl));
        }
        
        $total = (float) $this->context->cart->getOrderTotal(true);
        $url = array();
        $url['cancel_url']      = $this->context->link->getPageLink('order.php', $ssl);
        $url['callback_url']    = $this->context->link->getModuleLink('gocoinpay', 'validation', array('pps' => 1), (Configuration::get('PS_SSL_ENABLED'))?true :false);
        
        $ps_version = _PS_VERSION_;
        $show_breadcrumb = '1';
        $return_url_param = array('id_cart'   =>(int) $this->context->cart->id,
                          			  'id_module' =>(int) $this->module->id,
	  	                            'key'		    =>	$this->context->customer->secure_key);
        
        if((int) version_compare($ps_version, '1.5.6.2', '>')){
             $show_breadcrumb = '0';
        }  
        $url['redirect_url'] = $this->context->link->getPageLink('order-confirmation.php', $ssl, (int)$this->context->language->id,$return_url_param);
        
        $options = array();
        $options = array(
            'price_currency'        => $price_currency,
            'base_price'            => (float) $this->context->cart->getOrderTotal(true),
            'base_price_currency'   => $data['currency_code'],
            'callback_url'          => $url['callback_url'],
            'redirect_url'          => $url['redirect_url'],
            'order_id'              => 'Temporary Id :' . $cart->id,
            'customer_name'         => $data['name'],
            'customer_address_1'    => $data['address1'],
            'customer_address_2'    => $data['address2'],
            'customer_city'         => $data['city'],
            'customer_region'       => $data['state'],
            'customer_postal_code'  => $data['zip'],
            'customer_country'      => $data['country'],
            'customer_phone'        => $data['day_phone_b'],
            'customer_email'        => $data['email'],
            'user_defined_1'        => (int) $currency->id,
            'user_defined_2'        => $billing_customer->secure_key,
            'user_defined_3'        => $cart->id,
        );
        $key                       = $gocoin->getGUID();
        $signature                 = $gocoin->getSignatureText($options, $key);
        $options['user_defined_8'] = $signature;

        $json_str = '';
        $result = '';
        $messages ='';
        $redirect ='';
        if (!$gocoin_token) { //-----------If  Token not found 
            $result = 'error'; 
            $errorlog      .= 'Access Token Blank';
            $messages =  'GoCoin Payment Paramaters not Set. Please report this to Site Administrator.';
            
        }
        else { // If  Token  found 
            try {
                $user = GoCoin::getUser($gocoin_token); //----------- If no Error in user creation from token
                if ($user) {
                    $merchant_id = $user->merchant_id;

                    if (!empty($merchant_id)) { //----------- If merchant_id Variable is not blank 
                        $invoice = GoCoin::createInvoice($gocoin_token, $merchant_id, $options);
                        if (!isset($invoice) ) {
                           $result = 'error';
                           $messages =  'Error in Processing Order using GoCoin, please try selecting other payment options';
                        }
                        elseif (isset($invoice->errors)) {
                            $result = 'error';
                            $errormsg = isset($invoice->errors->currency_code[0])? $invoice->errors->currency_code[0] : '';
                            $messages =  "Error in Processing Order using GoCoin ".$errormsg;
                            $errorlog      .=  $errormsg;
                        }
                        elseif (isset($invoice->error)) {
                            $result = 'error';
                            $messages =  "Error in Processing Order using GoCoin ".$invoice->error;
                            $errorlog      .=  $invoice->error;
                        }
                        elseif (isset($invoice->merchant_id) && $invoice->merchant_id != '' && isset($invoice->id) && $invoice->id != '') {
                            $url = $gocoin_url . $invoice->merchant_id . "/invoices/" . $invoice->id;
                             
                            $result = 'success';
                            $messages = 'success';
                            $redirect = $url;
                            $json_array = array(
                                'cart_id'           => $invoice->user_defined_3,
                                'invoice_id'        => $invoice->id,
                                'url'               => $url,
                                'status'            => 'invoice_created',
                                'btc_price'         => $invoice->price,
                                'price'             => $invoice->base_price,
                                'currency'          => $invoice->base_price_currency,
                                'currency_type'     => $invoice->price_currency,
                                'invoice_time'      => $invoice->created_at,
                                'expiration_time'   => $invoice->expires_at,
                                'updated_time'      => $invoice->updated_at,
                                'fingerprint'       => $signature,
                            );
                            $gocoin->addTransaction($type = 'payment', $json_array);  
                           
                        }
                        else { //-----------  if $invoice is balnk 
                            $result = 'error';
                            $messages =  'Error in Processing Order using GoCoin, please try selecting other payment options';
                            $errorlog      .=  'invoice variable blank ';
                        }
                    }
                    else
                    {  //----------- If merchant_id Variable is blank 
                        $result = 'error';
                        $messages =  'Error in Processing Order using GoCoin, please try selecting other payment options';
                        $errorlog      .=  'merchant_id variable blank ';
                    }
                } 
                else {//----------- If user Variable is blank 
                    $result = 'error';
                    $messages =  'Error in Processing Order using GoCoin, please try selecting other payment options';
                    $errorlog      .=  'User variable blank ';
                }
            }
            catch (Exception $e) 
            {  //----------- If  error in user creation from token
                $result = 'error';
                $messages = 'Error in Processing Order using GoCoin, please try selecting other payment options';
                $errorlog      .=  'error in user creation from token';
            }
        }
        
        
         $this->context->smarty->assign(array(
            '_show_breadcrumb' => $show_breadcrumb,
            '_payformaction' => $this->context->link->getModuleLink('gocoinpay', 'payform', array(),  (Configuration::get('PS_SSL_ENABLED'))?true :false),
            '_result'        => $result,
            '_messages'      => $messages,
            '_redirect'      => $redirect,
            'nbProducts'     => $cart->nbProducts(),
            'cust_currency'  => $cart->id_currency,
            'currencies'     => $this->module->getCurrency((int) $cart->id_currency),
            'total'          => $cart->getOrderTotal(true, Cart::BOTH),
            'this_path'      => $this->module->getPathUri(),
            'this_path_bw'   => $this->module->getPathUri(),
            'this_path_ssl'  => Tools::getShopDomainSsl(true, true) . __PS_BASE_URI__ . 'modules/' . $this->module->name . '/'
        ));
        
        if(isset($result) && $result=='error'){
               error_log($date = date('d.m.Y h:i:s').':'.$messages.'\n', 3, $error_log_path);
               $this->setTemplate('errors-messages.tpl');
        }
        elseif(isset($result) && $result=='success'){
            $this->setTemplate('payment_execution.tpl');
        }
        else{
              Tools::redirect($this->context->link->getPageLink('order.php', $ssl));
         }
   }
}

