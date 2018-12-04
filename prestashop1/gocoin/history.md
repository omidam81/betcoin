###Changelog

#### v1.3.4
1) Check and Warning message for minimum php 5.3.0 version requirement added and if PHP version is less than 5.3.0 the payment opion is disabled on frontend.<br><br>
2) Fixed the scope operators scope=user_read+invoice_read_write and remove merchant_read (file 	/gocoinpay/views/templates/admin/configuration.tpl)<br><br>
3) Fixed validations and display of messages & log error<br>
  file /gocoinpay/views/templates/front/errors-messages.tpl<br>
  		 /gocoinpay/views/templates/front/payment_execution.tpl<br>
  		 /gocoinpay/controllers/front/payment.php<br>
  		 /gocoinpay/controllers/front/validation.php<br>

#### v1.3.5
1) Added multi language support using function getPageLink() in files (/controllers/front/payment.php and payform.php)
2) Corrected logo image
