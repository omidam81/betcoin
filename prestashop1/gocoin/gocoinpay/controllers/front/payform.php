<?php
class GocoinpayPayformModuleFrontController extends ModuleFrontController
{
	public $ssl = true;
  
	/**
	 * @see FrontController::initContent()
	 */
  
	public function initContent()
	{
      
      $ssl = Configuration::get('PS_SSL_ENABLED')?true:null;
      $this->gocoin = new Gocoinpay();
      $_url     = isset($_POST['gurl'])  && !empty($_POST['gurl'])?$_POST['gurl']:'';
      if(!empty($_url)){
        Tools::redirect($_url);
        exit;
      }
     else 
     {
           Tools::redirect($this->context->link->getPageLink('order.php', $ssl));
         exit;
      }
	}
  
}
    