# Stolen Token Tracking Demo

  

This is a simple example showing how to track stolen ERC20 token. We used a private ethereum blockchain network runs a Geth node in development mode being monitored by ethlogger in docker-compose alongside a Splunk Enterprise container.

  

This demo is developed based on [https://github.com/splunk/splunk-connect-for-ethereum/tree/master/examples/geth-multiple-nodes](https://github.com/splunk/splunk-connect-for-ethereum/tree/master/examples/geth-multiple-nodes).

  

## Background

  

On September 26, 2020, [https://www.kucoin.com/](https://www.kucoin.com/) which is one of the biggest CEX (centralized cryptocurrency exchange) was hacked and about $450million assets were stolen. 1.7billion DX tokens [https://etherscan.io/token/0x973e52691176d36453868d9d86572788d27041a9#balances](https://etherscan.io/token/0x973e52691176d36453868d9d86572788d27041a9#balances) were stolen. The [snapshot](./images/DX_stolen.png) were taken. This token issuing smart contact did not include blacklist function so it could not freeze the hacker accounts holding stolen tokens. In addition since this project has been existed more than two years, token swap might be a big problem for many non-technical community members.

  

We created this demo to simulate the hacking process and developed a tool to track the stolen tokens. If you want to track the tokens in the Ethereum main network, it is very easy to operate by simply modify this demo.

  

## Design

  

We have three wallets representing: token issuer, CEX and hacker.

| role |node |wallet |wallet address |

|----------------|-------------------------------|----------------------|--------------------------------------------|

|`token issuer` |`geth-miner1` |`creator_wallet` |`0x8cc5a1a0802db41db826c2fcb72423744338dcb0`|

|`CEX` |`geth-miner2` |`CEX_wallet` |`0x3590aca93338b0721966a8d0c96ebf2c4c87c544`|

|`hacker` |`geth-node` |`hacker_wallet` |`0x4d980799b71ae28fde37b8cadbe56ef8305b1727`|

  

Although we can use one wallet to simulate the operation by switching different wallet accounts, we still use three wallets for clarification.

  

Nodes are docker containers running Ethereum network. Wallets stored accounts information, so we could use wallet to transfer tokens.

  

Truffle is a popular tool to develop, test and deploy smart contract. By connecting a wallet, we can use it to deploy a smart contract to public/private Ethereum network. There are many other tools like [https://remix.ethereum.org/](https://remix.ethereum.org/) you can use.

  

[Metamask](https://metamask.io/) is a popular tool as a wallet supporting UI operation. Since we used commands here, we choose HD wallet in this project for automatic process.

  

We use [DX token](https://etherscan.io/address/0x973e52691176d36453868d9d86572788d27041a9#code) contract as a token issue contract.

  

## Run

**Note**: `checkpoints.json` file is automatically generated during the runtime. Before restarting docker containers, please make sure there is no `checkpoints.json` file in the directory. Just delete this file if it exists in the directory. Because I found the the ethlogger would not capture the `sourcetype: "ethereum:block"` and `sourcetype: ethereum:transaction` when `checkpoints.json` file exists.

  

1. Start docker-compose

```sh-session
$ cd token-tracking

$ docker-compose up -d
```

3. Wait for all containers to start.

  

You can rely on the output of `docker ps` to see the state of services.

  

4. Deploy Token to private Ethereum network

  

Explained in the design section, we use `truffle` and `HD wallet` in this project. Let's start a terminal and connect to `creator-wallet` container to issue tokens.

Connect to `creator-wallet`

```sh-session
$ docker exec -it creator-wallet /bin/sh
```

DX token issue

Token issue smart contract is at `/creator_wallet/contracts/Migrations.sol`. Run this command to issue DX token.

```
$ truffle migrate --network private
```

After issuing DX token, the owner will send 5000000 DX tokens to CEX (centralized exchange) wallet `3590aca93338b0721966a8d0c96ebf2c4c87c544` for trading purpose.

```
$ truffle console --network private

truffle(private)> web3.eth.getAccounts()

truffle(private)> let instance = await DxToken.deployed();

truffle(private)> instance.transfer('3590aca93338b0721966a8d0c96ebf2c4c87c544', 5000000)
```

5. Hack CEX


A hacker could access CEX wallet to transfer tokens to his accounts. Let's simulate this process by running on another container which could access the CEX wallet. Now we start another terminal to connect `cex-wallet`.

```
$ cd token-tracking

$ docker exec -it cex-wallet /bin/sh
```

4000000 DX tokens were stolen to a hacker account `4d980799b71ae28fde37b8cadbe56ef8305b1727`.

```
$ truffle console --network private

truffle(private)> web3.eth.getAccounts()

truffle(private)> let instance = await DxToken.deployed();

truffle(private)> instance.balanceOf('3590aca93338b0721966a8d0c96ebf2c4c87c544')

truffle(private)> instance.transfer('4d980799b71ae28fde37b8cadbe56ef8305b1727', 4000000)

truffle(private)> instance.balanceOf('3590aca93338b0721966a8d0c96ebf2c4c87c544')
```

6. Stoken token tracking

For any transfer transaction, we can track them by monitor transactions/blocks using ethlogger and Splunk data platform.
Go to [http://localhost:8000](http://localhost:8000) and login using user `admin` and password `changeme`.

Goto Dashboard and open `Hacked Token Transfer`. This dashboard will track and display all the transactions sending out from the hacker account in realtime. If the receiving address belongs to a CEX, such as Binance, Coinbase, Huobi and etc, we can contact them to freeze incoming tokens.

With the enterprise license, we could setup alert sending email/message to notify token issuer for quick responses.

7. Stolen tokens transfer

Stolen tokens might be transferred to another CEX to trade or DEX to swap to other cryptocurrencies such as BTC/ETH/USDT etc. So we simulated this operation at hacker's wallet in the third docker container. Let's start the third terminal to connect to `hacker-wallet`.

```
$ docker exec -it hacker-wallet /bin/sh
```

Transfer DX to other wallet address.

At the same time, open `Splunk -> Dashboard -> Hacked Token Transfer`. We can use the dashboard to monitor realtime activity in the account. By executing the following commands, we will initiate a sequence of transactions from the stolen account to other accounts. The transaction activities should be reflected on the dashboard automatically right after the transaction execution.

  

```
$ truffle console --network private

truffle(private)> web3.eth.getAccounts()

truffle(private)> let instance = await DxToken.deployed();

truffle(private)> instance.transfer('0xbe0eb53f46cd790cd13851d5eff43d12404d33e8', 500000)

truffle(private)> instance.transfer('0xe93381fb4c4f14bda253907b18fad305d799241a', 500000)

truffle(private)> instance.transfer('0x11eb25a55eF22B13eEE99bECfcC98535482B9dA1', 700000)

truffle(private)> instance.transfer('0xbe0eb53f46cd790cd13851d5eff43d12404d33e8', 20000)

truffle(private)> instance.transfer('0x6A19aDbC183b146A4D2f0dD4Ae9143934C50B112', 30000)
```

Actually `0xbe0eb53f46cd790cd13851d5eff43d12404d33e8`belongs to Binance and `0xe93381fb4c4f14bda253907b18fad305d799241a` belongs to Huobi.

  

8. Future work


`Hacked Token Transfer` only shows the basic stolen token activities, so we could do more sophisticated analysis such as anomaly account detection by machine learning algorithm and account linkage analysis.

  

## Note

  

> This example is not meant to be used in a production setup.

> Splunk and ethlogger persist data using local volumes. If you would like to start clean run the following.

> Using the logging driver to log to a container in the same docker-compose stack shouldn't be used in production.

  

To exit truffle

```sh-session
$ .exit
```

To exit docker container

```sh-session
$ exit
```

To stop docker containers and release the resources

```sh-session
$ docker-compose down

$ docker volume prune

$ rm checkpoints.json
```

