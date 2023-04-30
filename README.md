# Gearbox Claim and Bribe - Gelato web3 script <!-- omit in toc -->

This is a Gelato script to claim Gearbox rewards and post those rewards as bribe to Aura and Balancer on Hidden Hand

This is a clone of the templat (https://github.com/gelatodigital/web3-functions-template.git)

## Project Setup

1. Install project dependencies

```
yarn install
```

2. Configure your local environment:

- Copy `.env.example` to init your own `.env` file

```
cp .env.example .env
```

- Complete your `.env` file with your private settings

```
PROVIDER_URL="" # your provider URL (e.g. https://eth-mainnet.alchemyapi.io/v2/YOUR_ALCHEMY_ID)
PRIVATE_KEY="" # optional: only needed if you wish to create a task from the CLI instead of the UI
```
