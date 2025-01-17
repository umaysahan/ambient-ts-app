import { lookupChain } from '@crocswap-libs/sdk/dist/context';
import { blastSepoliaETH, blastSepoliaUSDB } from '../defaultTokens';
import { NetworkIF } from '../../types/NetworkIF';
import { TopPool } from './TopPool';
import { Provider } from 'ethers';
import { GCGO_TESTNET_URL } from '../gcgo';
import { bigIntToFloat } from '@crocswap-libs/sdk';

const chainIdHex = '0xa0c71fd';
const chainSpecFromSDK = lookupChain(chainIdHex);

const chainSpecForWalletConnector = {
    chainId: Number(chainIdHex),
    name: 'Blast Sepolia',
    currency: 'ETH',
    rpcUrl: 'https://sepolia.blast.io/',
    explorerUrl: 'https://testnet.blastscan.io',
};

export const blastSepolia: NetworkIF = {
    chainId: chainIdHex,
    chainSpec: chainSpecFromSDK,
    graphCacheUrl: GCGO_TESTNET_URL,
    evmRpcUrl: chainSpecForWalletConnector.rpcUrl,
    chainSpecForWalletConnector: chainSpecForWalletConnector,
    defaultPair: [blastSepoliaETH, blastSepoliaUSDB],
    poolIndex: chainSpecFromSDK.poolIndex,
    gridSize: chainSpecFromSDK.gridSize,
    displayName: chainSpecForWalletConnector.name,
    topPools: [
        new TopPool(
            blastSepoliaETH,
            blastSepoliaUSDB,
            chainSpecFromSDK.poolIndex,
        ),
    ],
    blockExplorer: chainSpecForWalletConnector.explorerUrl,
    getGasPriceInGwei: async (provider?: Provider) => {
        if (!provider) return 0;
        return (
            bigIntToFloat((await provider.getFeeData()).gasPrice || BigInt(0)) *
            1e-9
        );
    },
};
