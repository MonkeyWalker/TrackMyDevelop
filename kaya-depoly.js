const fs = require('fs');
const { BN, Long } = require('@zilliqa-js/util');
const { Zilliqa } = require('@zilliqa-js/zilliqa');
const {Contract} = require('@zilliqa-js/contract')
//const zilliqa = new Zilliqa('https://api.zilliqa.com');
const zilliqa = new Zilliqa('https://127.0.0.1:4200');
const CP = require ('@zilliqa-js/crypto');
const BlockChain = require('@zilliqa-js/blockchain');



//Populate the wallet with an account
privkey = '3141f781b30d66803e8fdddbb7ca028b814d3d1b54525ba2c117d844fc6af399';

zilliqa.wallet.addByPrivateKey(
    privkey
);

add = CP.getAddressFromPrivateKey(privkey);
console.log('Your account address is:');
console.log(`0x${add}`);
console.log('Your account public key is :')
console.log(zilliqa.wallet.defaultAccount.publicKey)




async function callLock(contract){
    const callTx = await contract.call('newLock', [
            {
                vname: 'receiver',
                type: 'ByStr20',
                value: '0x1234567890123456789012345678901234567890',
            },{
                vname: 'hValue',
                type: 'ByStr32',
                value: '0xca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee47bb',
            },{
                vname: 'nLockNum',
                type: 'Uint128',
                value: '100000',
            }
            ],
        {
            amount: new BN(120),
            gasPrice: new BN('1_000'),
            gasLimit: Long.fromNumber(5000)
        });
    console.log(callTx)
    const { txParams } = callTx.txParams;
    console.log(txParams);

    const state = await contract.getState();
    console.log(state);
}

async function lockIdExist(contract,lockId){
    console.log(lockId);
    const callTx = await contract.call('lockIdExist', [{
                vname: 'lockId',
                type: 'ByStr32',
                value: lockId,
            }],
        {
            amount: new BN(120),
            gasPrice: new BN('1_000'),
            gasLimit: Long.fromNumber(5000)
        });

    const { receipt } = callTx.txParams;
    console.log(receipt);

    const state = await contract.getState();
    console.log(state);
}

async function depolyContract() {
    const balance =  await zilliqa.blockchain.getBalance(`0x${add}`)
    console.log(balance.result)


    try {

        console.log('Deploying a contract now');
        // Deploy a contract
        const code = fs.readFileSync('./contracts/HashTimeLock.scilla', 'utf-8');
        var codeStr = code.replace(/\r/g, "")

        const init = [
            {
                "vname": "_scilla_version",
                "type": "Uint32",
                "value": "0"
            },
            {
                vname: 'owner',
                type: 'ByStr20',
                // NOTE: all byte strings passed to Scilla contracts _must_ be
                // prefixed with 0x. Failure to do so will result in the network
                // rejecting the transaction while consuming gas!
                value: `0x${add}`,
            },
            // Necessary for local Kaya testing
            /*{
                vname: '_creation_block',
                type: 'BNum',
                value: '100'
            },
            {
                vname : `_this_address`,
                type:`ByStr20`,
                value:`0x${add}`
            }*/
        ];
        // instance of class Contract
        const contract = zilliqa.contracts.new(codeStr, init);

        const [deployTx, deployedContract] = await contract.deploy({
            gasPrice: new BN('1_00'),
            gasLimit: Long.fromNumber(500000)
        });
        // Introspect the state of the underlying transaction
        console.log('Deployment Transaction ID: ', deployTx.id);
        console.log('Deployment Transaction Receipt: ', deployTx.txParams.receipt);
        console.log('The contract address is  :' ,deployedContract.address);
       // callLock(deployedContract)
        return deployedContract.address
    } catch (err) {
        console.log('Blockchain Error');
        console.log(err);
    }
}

depolyContract();


