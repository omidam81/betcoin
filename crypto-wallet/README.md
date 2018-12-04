# Setup #

Copy the volumes-example folder to the parent folder of the repo

```shell
cp -r volumes-example ../volumes
```

This example folder has bitcoin set up in testnet mode. If you are not
atticus or wayne, there is not reason you need to change this.

Run the coins

```shell
make COIN=bitcoin run
make COIN=litecoin run
make COIN=dogecoin run
```

It will take a while for the blockchains to download



