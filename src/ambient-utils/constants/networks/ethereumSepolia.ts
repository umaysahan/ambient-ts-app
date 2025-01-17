import { lookupChain } from '@crocswap-libs/sdk/dist/context';
import { sepoliaETH, sepoliaUSDC, sepoliaWBTC } from '../defaultTokens';
import { NetworkIF } from '../../types/NetworkIF';
import { TopPool } from './TopPool';
import { GCGO_TESTNET_URL } from '../gcgo';
import { Provider } from 'ethers';
import { bigIntToFloat } from '@crocswap-libs/sdk';

export const SEPOLIA_RPC_URL =
    import.meta.env.VITE_SEPOLIA_RPC_URL !== undefined
        ? import.meta.env.VITE_SEPOLIA_RPC_URL
        : 'https://ethereum-sepolia-rpc.publicnode.com';

const chainIdHex = '0xaa36a7';
const chainSpecFromSDK = lookupChain(chainIdHex);

const chainSpecForWalletConnector = {
    chainId: Number(chainIdHex),
    name: 'Sepolia',
    currency: 'ETH',
    rpcUrl: SEPOLIA_RPC_URL,
    explorerUrl: 'https://sepolia.etherscan.io',
};

export const ethereumSepolia: NetworkIF = {
    chainId: chainIdHex,
    chainSpec: chainSpecFromSDK,
    graphCacheUrl: GCGO_TESTNET_URL,
    evmRpcUrl: SEPOLIA_RPC_URL,
    chainSpecForWalletConnector: chainSpecForWalletConnector,
    defaultPair: [sepoliaETH, sepoliaUSDC],
    defaultPairFuta: [sepoliaETH, sepoliaWBTC],
    poolIndex: chainSpecFromSDK.poolIndex,
    gridSize: chainSpecFromSDK.gridSize,
    blockExplorer: chainSpecForWalletConnector.explorerUrl,
    displayName: chainSpecForWalletConnector.name,
    topPools: [
        new TopPool(sepoliaETH, sepoliaUSDC, chainSpecFromSDK.poolIndex),
        new TopPool(sepoliaETH, sepoliaWBTC, chainSpecFromSDK.poolIndex),
        new TopPool(sepoliaUSDC, sepoliaWBTC, chainSpecFromSDK.poolIndex),
    ],
    getGasPriceInGwei: async (provider?: Provider) => {
        if (!provider) return 0;
        return (
            bigIntToFloat((await provider.getFeeData()).gasPrice || BigInt(0)) *
            1e-9
        );
    },
};
