import { lookupChain } from '@crocswap-libs/sdk/dist/context';
import {
    scrollSepoliaETH,
    scrollSepoliaUSDC,
    scrollSepoliaWBTC,
} from '../defaultTokens';
import { NetworkIF } from '../../types/NetworkIF';
import { TopPool } from './TopPool';
import { Provider } from 'ethers';
import { GCGO_TESTNET_URL } from '../gcgo';
import { bigIntToFloat } from '@crocswap-libs/sdk';

const chainIdHex = '0x8274f';
const chainSpecFromSDK = lookupChain(chainIdHex);

const chainSpecForWalletConnector = {
    chainId: Number(chainIdHex),
    name: 'Scroll Sepolia',
    currency: 'ETH',
    rpcUrl: 'https://sepolia-rpc.scroll.io/',
    explorerUrl: 'https://sepolia.scrollscan.dev',
};

export const scrollSepolia: NetworkIF = {
    chainId: chainIdHex,
    chainSpec: chainSpecFromSDK,
    graphCacheUrl: GCGO_TESTNET_URL,
    evmRpcUrl: chainSpecForWalletConnector.rpcUrl,
    chainSpecForWalletConnector: chainSpecForWalletConnector,
    defaultPair: [scrollSepoliaETH, scrollSepoliaUSDC],
    poolIndex: chainSpecFromSDK.poolIndex,
    gridSize: chainSpecFromSDK.gridSize,
    blockExplorer: chainSpecForWalletConnector.explorerUrl,
    displayName: chainSpecForWalletConnector.name,
    topPools: [
        new TopPool(
            scrollSepoliaETH,
            scrollSepoliaUSDC,
            chainSpecFromSDK.poolIndex,
        ),
        new TopPool(
            scrollSepoliaETH,
            scrollSepoliaWBTC,
            chainSpecFromSDK.poolIndex,
        ),
        new TopPool(
            scrollSepoliaUSDC,
            scrollSepoliaWBTC,
            chainSpecFromSDK.poolIndex,
        ),
    ],
    getGasPriceInGwei: async (provider?: Provider) => {
        if (!provider) return 0;
        return (
            bigIntToFloat((await provider.getFeeData()).gasPrice || BigInt(0)) *
            1e-9
        );
    },
};
