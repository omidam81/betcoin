<?php
if ( !defined('__DIR__') ) define('__DIR__', dirname(__FILE__)); //5.2.x compatibility
/**
 * GoCoin Api
 * A PHP-based GoCoin client library with a focus on simplicity and ease of integration
 */

require_once(__DIR__.'/GoCoin.php');

class GoCoinAdmin
{
  #     #   #####   #######  ######   
  #     #  #     #  #        #     #  
  #     #  #        #        #     #  
  #     #   #####   #####    ######   
  #     #        #  #        #   #    
  #     #  #     #  #        #    #   
   #####    #####   #######  #     #  

  /**
   * @return a list of users
   */
  static public function listUsers($token)
  {
    $client = Client::getInstance($token);
    $user = $client -> api -> user -> getUsers();
    if (!$user) { throw new Exception($client -> getError()); }
    else        { return $user; }
  }

  /**
   * @return a created user
   */
  static public function createUser($token,$user)
  {
    $client = Client::getInstance($token);
    $user = $client -> api -> user -> createUser($user);
    if (!$user) { throw new Exception($client -> getError()); }
    else        { return $user; }
  }

  /**
   * @return a boolean representing the successful delete of a user
   */
  static public function deleteUser($token,$id)
  {
    $client = Client::getInstance($token);
    $user = $client -> api -> user -> deleteUser($id);
    if (!$user) { throw new Exception($client -> getError()); }
    else        { return $user; }
  }

  #     #  #######  ######    #####   #     #     #     #     #  #######  
  ##   ##  #        #     #  #     #  #     #    # #    ##    #     #     
  # # # #  #        #     #  #        #     #   #   #   # #   #     #     
  #  #  #  #####    ######   #        #######  #     #  #  #  #     #     
  #     #  #        #   #    #        #     #  #######  #   # #     #     
  #     #  #        #    #   #     #  #     #  #     #  #    ##     #     
  #     #  #######  #     #   #####   #     #  #     #  #     #     #     

  /**
   * NOTE: admin only
   * @return an array of merchants
   */
  static public function listMerchants($token)
  {
    $client = Client::getInstance($token);
    $merchants = $client -> api -> merchant -> listMerchants();
    if (!$merchants)  { throw new Exception($client -> getError()); }
    else              { return $merchants; }
  }

  /**
   * NOTE: admin only
   * @return an array of merchants
   */
  static public function createMerchant($token,$merchant)
  {
    $client = Client::getInstance($token);
    $merchant = $client -> api -> merchant -> createMerchant($merchant);
    if (!$merchant) { throw new Exception($client -> getError()); }
    else            { return $merchant; }
  }

  /**
   * NOTE: admin only
   * @return a merchant object after deleting it
   */
  static public function deleteMerchant($token,$merchant_id)
  {
    $client = Client::getInstance($token);
    $merchant = $client -> api -> merchant -> deleteMerchant($id);
    if (!$merchant) { throw new Exception($client -> getError()); }
    else            { return $merchant; }
  }

  #     #  #######  ######    #####   #     #     #     #     #  #######  
  ##   ##  #        #     #  #     #  #     #    # #    ##    #     #     
  # # # #  #        #     #  #        #     #   #   #   # #   #     #     
  #  #  #  #####    ######   #        #######  #     #  #  #  #     #     
  #     #  #        #   #    #        #     #  #######  #   # #     #     
  #     #  #        #    #   #     #  #     #  #     #  #    ##     #     
  #     #  #######  #     #   #####   #     #  #     #  #     #     #     


  #     #   #####   #######  ######    #####   
  #     #  #     #  #        #     #  #     #  
  #     #  #        #        #     #  #        
  #     #   #####   #####    ######    #####   
  #     #        #  #        #   #          #  
  #     #  #     #  #        #    #   #     #  
   #####    #####   #######  #     #   #####   

  /**
   * @return the result of adding a user to a merchant account
   */
  static public function addMerchantUser($token,$merchant_id,$user_id)
  {
    $client = Client::getInstance($token);
    $result = $client -> api -> merchant_users -> addMerchantUser($merchant_id,$user_id);
    if ($result === FALSE) { throw new Exception($client -> getError()); }
    else                   { return $result; }
  }

  /**
   * @return the result of deleting a user from a merchant account
   */
  static public function deleteMerchantUser($token,$merchant_id,$user_id)
  {
    $client = Client::getInstance($token);
    $result = $client -> api -> merchant_users -> deleteMerchantUser($merchant_id,$user_id);
    if ($result === FALSE) { throw new Exception($client -> getError()); }
    else                   { return $result; }
  }
}

?>