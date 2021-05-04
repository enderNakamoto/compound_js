# compound

You should have node and npm installed already 

STEP 1: Install dependencoes

```
npm install
```

STEP 2: 

add the Fantom url and bot address private key in a .env file.  (make a .env file if you don;t have it)

.env file looks like this for fantom:
```
FTM_PUBLIC_URL=https://rpcapi.fantom.network
FTM_ADMIN_PRIVATE_KEY=[YOUR_PRIVATE_KEY_HERE]
```
make sure the .env file does not get pushed to github, it has access to your  account

it should be added to .gitignore file

STEP 3 : Run the code 

for spirit: 

```
node spirit
```

for calculator: 

```
node calculator 
```

----------------------------------------------------------------------------------------------------
## Structure of the bot - Bot modules

We have the following helper files: 
* abis.js -> hold all human readable ether abis
* addresses.js -> all the  addresses needed for the bots 
* account.js -> setup the ethers account with provider 
* helpers.js -> misc helper functions 