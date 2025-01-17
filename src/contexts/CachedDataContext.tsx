import React, { createContext } from 'react';
import {
    FetchAddrFn,
    memoizeFetchEnsAddress,
    memoizeFetchTopPairedToken,
    FetchTopPairedTokenFn,
    FetchContractDetailsFn,
    memoizeFetchContractDetails,
    memoizeFetchAmbientListWalletBalances,
    memoizeFetchDexBalances,
    TokenPriceFn,
    memoizeTokenPrice,
    FetchBlockTimeFn,
    memoizeFetchBlockTime,
    AmbientListBalancesQueryFn,
    DexBalancesQueryFn,
} from '../ambient-utils/api';

import {
    PoolStatsFn,
    memoizePoolStats,
    SpotPriceFn,
    memoizeQuerySpotPrice,
    memoizeQuerySpotTick,
    memoizeGet24hChange,
    Change24Fn,
    memoizeGetLiquidityFee,
    LiquidityFeeFn,
    memoizeGetGlobalAuctionsList,
    GlobalAuctionListQueryFn,
    UserAuctionListQueryFn,
    memoizeGetUserAuctionsList,
    memoizeGetAuctionStatus,
    AuctionStatusQueryFn,
    AllPoolStatsFn,
    memoizeAllPoolStats,
} from '../ambient-utils/dataLayer';
import { NFTQueryFn, memoizeFetchNFT } from '../ambient-utils/api/fetchNft';

export interface CachedDataContextIF {
    cachedFetchAmbientListWalletBalances: AmbientListBalancesQueryFn;
    cachedFetchDexBalances: DexBalancesQueryFn;
    cachedFetchTokenPrice: TokenPriceFn;
    cachedPoolStatsFetch: PoolStatsFn;
    cachedAllPoolStatsFetch: AllPoolStatsFn;
    cachedGet24hChange: Change24Fn;
    cachedGetLiquidityFee: LiquidityFeeFn;
    cachedGetGlobalAuctionsList: GlobalAuctionListQueryFn;
    cachedGetAuctionStatus: AuctionStatusQueryFn;
    cachedGetUserAuctionsList: UserAuctionListQueryFn;
    cachedQuerySpotPrice: SpotPriceFn;
    cachedQuerySpotTick: SpotPriceFn;
    cachedTokenDetails: FetchContractDetailsFn;
    cachedEnsResolve: FetchAddrFn;
    cachedFetchTopPairedToken: FetchTopPairedTokenFn;
    cachedFetchBlockTime: FetchBlockTimeFn;
    cachedFetchNFT: NFTQueryFn;
}

export const CachedDataContext = createContext<CachedDataContextIF>(
    {} as CachedDataContextIF,
);

// TODO: refactor to cache in context and use other contexts as dependencies
export const CachedDataContextProvider = (props: {
    children: React.ReactNode;
}) => {
    const cachedDataState: CachedDataContextIF = {
        cachedFetchAmbientListWalletBalances:
            memoizeFetchAmbientListWalletBalances(),
        cachedFetchDexBalances: memoizeFetchDexBalances(),
        cachedFetchTokenPrice: memoizeTokenPrice(),
        cachedPoolStatsFetch: memoizePoolStats(),
        cachedAllPoolStatsFetch: memoizeAllPoolStats(),
        cachedGet24hChange: memoizeGet24hChange(),
        cachedGetLiquidityFee: memoizeGetLiquidityFee(),
        cachedGetGlobalAuctionsList: memoizeGetGlobalAuctionsList(),
        cachedGetAuctionStatus: memoizeGetAuctionStatus(),
        cachedGetUserAuctionsList: memoizeGetUserAuctionsList(),
        cachedQuerySpotPrice: memoizeQuerySpotPrice(),
        cachedQuerySpotTick: memoizeQuerySpotTick(),
        cachedTokenDetails: memoizeFetchContractDetails(),
        cachedEnsResolve: memoizeFetchEnsAddress(),
        cachedFetchTopPairedToken: memoizeFetchTopPairedToken(),
        cachedFetchBlockTime: memoizeFetchBlockTime(),
        cachedFetchNFT: memoizeFetchNFT(),
    };

    return (
        <CachedDataContext.Provider value={cachedDataState}>
            {props.children}
        </CachedDataContext.Provider>
    );
};
