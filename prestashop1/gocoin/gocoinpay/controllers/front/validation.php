<?php
include(dirname(__FILE__).'/../../config/config.inc.php');
include(dirname(__FILE__).'/../../header.php');                  
class gocoin_validation  
{
	/**
	* @see FrontController::initContent()
	*/
	public function initContent()
	{
      $this->gocoin = new Gocoinpay;
      $result = $this->_paymentStandard();
	 	  die($result);
	}
  
	public function getNotifyData() {
       $post_data = file_get_contents("php://input");
            error_log('\n'.date('l jS \of F Y h:i:s A').$post_data,3,_PS_ROOT_DIR_.'/log/tester.log');
        if (!$post_data) {
            $response = new stdClass();
            $response->error = 'Post Data Error';
            return $response;
        }
        $response = json_decode($post_data);
        return $response;
  }
	
	private function _paymentStandard()
	{
      $module_display = $this->module->displayName;
      
      $response = $this->getNotifyData();
       if(!$response){
          die('error');
        //======================Error=============================     
      }
      if($response->error){
          
          die('error');
        //======================Error=============================     
      }
      if(isset($response->payload)){
        //======================IF Response Get=============================     
          
         $event             = $response->event ;          
         $cart_id           = (int) $response->payload->user_defined_3; 
         $redirect_url      = $response->payload->redirect_url;   
         $transction_id     = $response->payload->id;  
         $total             = $response->payload->base_price;  
         $status            = $response->payload->status;
         $currency_id       = $response->payload->user_defined_1;
         $secure_key        = $response->payload->user_defined_2 ;
         $currency          = $response->payload->base_price_currency;
         $currency_type     = $response->payload->price_currency;
         $invoice_time      = $response->payload->created_at   ;      
         $expiration_time   = $response->payload->expires_at   ;
         $updated_time      = $response->payload->updated_at   ;
         $merchant_id       = $response->payload->merchant_id  ;
         $btc_price         = $response->payload->price  ;  
         $price             = $response->payload->base_price  ;
         $url = "https://gateway.gocoin.com/merchant/".$merchant_id ."/invoices/".$transction_id;
         $fprint            = $response->payload->user_defined_8;
         //=================== Set To Array=====================================//
         //Used for adding in db
         $iArray    = array(
             'cart_id'=>$cart_id,
             'invoice_id'=>$transction_id,
             'url'=>$url,
             'status'=>$event,
             'btc_price'=>$btc_price,
             'price'=>$price,
             'currency'=>$currency,
             'currency_type'=>$currency_type,
             'invoice_time'=>$invoice_time,
             'expiration_time'=>$expiration_time,
             'updated_time'=>$updated_time,
             'fingerprint'       => $fprint);   
         
         
         
         $cart = new Cart((int)$cart_id);
         
         $context->cart = $cart; 
         if (!Validate::isLoadedObject($cart))
					$errors[] = 'Invalid Cart ID';
				else
				{
            $currency = new Currency((int)Currency::getIdByIsoCode($currency_id ));	
               
            $i_id =   $this->gocoin->getFPStatus($iArray );
                    
               if(!empty($i_id) && $i_id==$transction_id){
                switch($event)
                {
                    case 'invoice_created':
                    case 'invoice_payment_received':
                        $sts = (int) Configuration::get('PS_OS_PREPARATION');
                        $this->gocoin->validateOrder($cart_id, $sts, $total, $this->gocoin->displayName, NULL, $mailVars, $currency_id, false, $secure_key);
                        $this->gocoin->addTransactionId((int)$this->gocoin->currentOrder,$transction_id);
                        $iArray['order_id']= (int)$this->gocoin->currentOrder;
                        $this->gocoin->updateTransaction('payment',$iArray );
                      break;
                    case 'invoice_ready_to_ship':
                    
                       if ($cart->OrderExists())
                        {
                           if (($status == 'paid') || ($status == 'ready_to_ship')) {
                              $order = new Order((int)Order::getOrderByCartId($cart->id));
                              $order_status = (int) Configuration::get('PS_OS_PAYMENT');
                              $new_history = new OrderHistory();
                              $new_history->id_order = (int)$order->id;
                              $new_history->changeIdOrderState((int)$order_status, $order, true);
                              $new_history->addWithemail(true);
                              $iArray['order_id']= (int)$order->id;

                              $this->gocoin->updateTransaction('payment',$iArray );  
                            }
                        }
                        break;
                }
                
               }
               elseif(!empty($fprint)){
                    $msg = "\n Fingerprint : ".$fprint. "does not match for Order id :".$order_id;
                    error_log($msg, 3, _PS_ROOT_DIR_.'/log/gocoin_error_log.txt');
                }
                  
           }

      }      
      
	}
	
}

$validation = new gocoin_validation();
$validation->initContent();