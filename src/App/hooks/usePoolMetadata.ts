import { CrocEnv, sortBaseQuoteTokens } from '@crocswap-libs/sdk';
import {
    Dispatch,
    SetStateAction,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { GCGO_OVERRIDE_URL } from '../../ambient-utils/constants';
import {
    LimitOrderIF,
    LimitOrderServerIF,
    PositionIF,
    PositionServerIF,
    SinglePoolDataIF,
    TokenIF,
    TransactionIF,
    TransactionServerIF,
} from '../../ambient-utils/types';
import {
    TokenPriceFn,
    FetchAddrFn,
    FetchContractDetailsFn,
    fetchPoolRecentChanges,
    fetchPoolLiquidity,
} from '../../ambient-utils/api';
import {
    SpotPriceFn,
    filterLimitArray,
    getLimitOrderData,
    getPositionData,
    getTransactionData,
} from '../../ambient-utils/dataLayer';
import { Provider } from 'ethers';
import { DataLoadingContext } from '../../contexts/DataLoadingContext';
import { GraphDataContext } from '../../contexts/GraphDataContext';
import { TradeDataContext } from '../../contexts/TradeDataContext';
import { RangeContext } from '../../contexts/RangeContext';
import { AppStateContext } from '../../contexts/AppStateContext';
import { ChainDataContext } from '../../contexts';
import { fetchPoolLimitOrders } from '../../ambient-utils/api/fetchPoolLimitOrders';

interface PoolParamsHookIF {
    crocEnv?: CrocEnv;
    graphCacheUrl: string;
    provider?: Provider;
    chainId: string;
    poolIndex: number;
    userAddress: `0x${string}` | undefined;
    searchableTokens: TokenIF[];
    receiptCount: number;
    lastBlockNumber: number;
    isServerEnabled: boolean;
    isChartEnabled: boolean;
    cachedFetchTokenPrice: TokenPriceFn;
    cachedQuerySpotPrice: SpotPriceFn;
    cachedQuerySpotTick: SpotPriceFn;
    cachedTokenDetails: FetchContractDetailsFn;
    cachedEnsResolve: FetchAddrFn;
    setSimpleRangeWidth: Dispatch<SetStateAction<number>>;
}

// Hooks to update metadata and volume/TVL/liquidity curves on a per-pool basis
export function usePoolMetadata(props: PoolParamsHookIF) {
    const { chainId, poolIndex, crocEnv, provider } = props;
    const {
        tokenA,
        tokenB,
        defaultRangeWidthForActivePool,
        currentPoolPriceTick,
    } = useContext(TradeDataContext);
    const { setDataLoadingStatus } = useContext(DataLoadingContext);
    const {
        setUserPositionsByPool,
        setUserTransactionsByPool,
        setPositionsByPool,
        setLeaderboardByPool,
        setTransactionsByPool,
        setLimitOrdersByPool,
        setUserLimitOrdersByPool,
        setLiquidity,
        setLiquidityFee,
        positionsByPool,
        limitOrdersByPool,
    } = useContext(GraphDataContext);

    const { pathname } = location;

    const { allPoolStats } = useContext(ChainDataContext);

    const {
        server: { isEnabled: isServerEnabled },
        isUserIdle,
    } = useContext(AppStateContext);

    const { setAdvancedLowTick, setAdvancedHighTick, setAdvancedMode } =
        useContext(RangeContext);

    const ticksInParams =
        pathname.includes('lowTick') && pathname.includes('highTick');

    // hook to sync token addresses in RTK to token addresses in RTK
    const contextMatchesParams = useMemo(() => {
        let matching = false;
        const tokenAAddress = tokenA.address;
        const tokenBAddress = tokenB.address;

        if (pathname.includes('tokenA') && pathname.includes('tokenB')) {
            const getAddrFromParams = (token: string) => {
                const idx = pathname.indexOf(token);
                const address = pathname.substring(idx + 7, idx + 49);
                return address;
            };
            const addrTokenA = getAddrFromParams('tokenA');
            const addrTokenB = getAddrFromParams('tokenB');
            if (
                addrTokenA.toLowerCase() === tokenAAddress.toLowerCase() &&
                addrTokenB.toLowerCase() === tokenBAddress.toLowerCase()
            ) {
                matching = true;
            }
        }

        return matching;
    }, [pathname, tokenA, tokenB]);

    const baseTokenAddress = useMemo(
        () => sortBaseQuoteTokens(tokenA.address, tokenB.address)[0],
        [tokenA, tokenB],
    );

    const quoteTokenAddress = useMemo(
        () => sortBaseQuoteTokens(tokenA.address, tokenB.address)[1],
        [tokenA, tokenB],
    );

    const isTokenABase = useMemo(
        () =>
            tokenA.address ===
            sortBaseQuoteTokens(tokenA.address, tokenB.address)[0],
        [tokenA, tokenB],
    );

    const baseTokenDecimals = useMemo(
        () =>
            tokenA.address ===
            sortBaseQuoteTokens(tokenA.address, tokenB.address)[0]
                ? tokenA.decimals
                : tokenB.decimals,
        [tokenA, tokenB],
    );

    const quoteTokenDecimals = useMemo(
        () =>
            tokenA.address ===
            sortBaseQuoteTokens(tokenA.address, tokenB.address)[0]
                ? tokenB.decimals
                : tokenA.decimals,
        [tokenA, tokenB],
    );

    // Token and range housekeeping when switching pairs
    useEffect(() => {
        if (
            contextMatchesParams &&
            crocEnv &&
            tokenA.address &&
            tokenB.address
        ) {
            if (!ticksInParams) {
                setAdvancedLowTick(0);
                setAdvancedHighTick(0);
                setAdvancedMode(false);
                props.setSimpleRangeWidth(defaultRangeWidthForActivePool);
            }
        }
    }, [contextMatchesParams, tokenA.address + tokenB.address, ticksInParams]);

    const [newTxByPoolData, setNewTxByPoolData] = useState<
        TransactionIF[] | undefined
    >([]);

    const [newLimitsByPoolData, setNewLimitsByPoolData] = useState<
        LimitOrderIF[] | undefined
    >([]);

    const [newRangesByPoolData, setNewRangesByPoolData] = useState<
        PositionIF[] | undefined
    >([]);

    const [newLeaderboardByPoolData, setNewLeaderboardByPoolData] = useState<
        PositionIF[] | undefined
    >([]);

    useEffect(() => {
        // reset new data when switching pairs
        setNewTxByPoolData(undefined);
        setNewLimitsByPoolData(undefined);
        setNewRangesByPoolData(undefined);
        setNewLeaderboardByPoolData(undefined);
    }, [baseTokenAddress + quoteTokenAddress]);

    useEffect(() => {
        if (newTxByPoolData) {
            const filteredNewTxByPoolData = newTxByPoolData.filter((tx) => {
                return (
                    tx.base.toLowerCase() === baseTokenAddress.toLowerCase() &&
                    tx.quote.toLowerCase() === quoteTokenAddress.toLowerCase()
                );
            });
            if (filteredNewTxByPoolData.length > 0) {
                setTransactionsByPool((prev) => {
                    // Create a Set of existing transaction identifiers (e.g., txHash or txId)
                    const existingTxIds = new Set(
                        prev.changes.map(
                            (change) => change.txHash || change.txId,
                        ),
                    );
                    // Filter out transactions that are already in the state
                    const newUniqueTxByPoolData =
                        filteredNewTxByPoolData.filter(
                            (tx) => !existingTxIds.has(tx.txHash || tx.txId),
                        );
                    // Sort and remove the oldest transactions if necessary
                    const prevChangesCopy = [...prev.changes]; // Create a copy to avoid mutating state directly
                    if (newUniqueTxByPoolData.length > 0) {
                        prevChangesCopy.sort((a, b) => a.txTime - b.txTime);
                        prevChangesCopy.splice(0, newUniqueTxByPoolData.length);
                    }

                    const newTxsArray = [
                        ...prevChangesCopy,
                        ...newUniqueTxByPoolData,
                    ];

                    return {
                        dataReceived: true,
                        changes: newTxsArray,
                    };
                });
                setDataLoadingStatus({
                    datasetName: 'isPoolTxDataLoading',
                    loadingStatus: false,
                });
            }
        }
    }, [newTxByPoolData, baseTokenAddress + quoteTokenAddress]);

    useEffect(() => {
        if (newLimitsByPoolData) {
            const filteredNewLimitsByPoolData = newLimitsByPoolData.filter(
                (limit) => {
                    return (
                        limit.base.toLowerCase() ===
                            baseTokenAddress.toLowerCase() &&
                        limit.quote.toLowerCase() ===
                            quoteTokenAddress.toLowerCase()
                    );
                },
            );
            if (filteredNewLimitsByPoolData.length > 0) {
                setLimitOrdersByPool({
                    dataReceived: true,
                    limitOrders: filteredNewLimitsByPoolData,
                });
                setDataLoadingStatus({
                    datasetName: 'isPoolOrderDataLoading',
                    loadingStatus: false,
                });
            }
        }
    }, [newLimitsByPoolData, baseTokenAddress + quoteTokenAddress]);

    useEffect(() => {
        if (newRangesByPoolData) {
            const filteredNewRangesByPoolData = newRangesByPoolData.filter(
                (position) => {
                    return (
                        position.base.toLowerCase() ===
                            baseTokenAddress.toLowerCase() &&
                        position.quote.toLowerCase() ===
                            quoteTokenAddress.toLowerCase()
                    );
                },
            );
            if (filteredNewRangesByPoolData.length > 0) {
                setPositionsByPool({
                    dataReceived: true,
                    positions: filteredNewRangesByPoolData,
                });
                setDataLoadingStatus({
                    datasetName: 'isPoolRangeDataLoading',
                    loadingStatus: false,
                });
            }
        }
    }, [newRangesByPoolData, baseTokenAddress + quoteTokenAddress]);

    useEffect(() => {
        if (newLeaderboardByPoolData) {
            const filteredNewLeaderboardByPoolData =
                newLeaderboardByPoolData.filter((position) => {
                    return (
                        position.base.toLowerCase() ===
                            baseTokenAddress.toLowerCase() &&
                        position.quote.toLowerCase() ===
                            quoteTokenAddress.toLowerCase()
                    );
                });
            if (filteredNewLeaderboardByPoolData.length > 0) {
                setLeaderboardByPool({
                    dataReceived: true,
                    positions: filteredNewLeaderboardByPoolData,
                });
                setDataLoadingStatus({
                    datasetName: 'isPoolRangeDataLoading',
                    loadingStatus: false,
                });
            }
        }
    }, [newLeaderboardByPoolData, baseTokenAddress + quoteTokenAddress]);

    useEffect(() => {
        const currentPoolData = allPoolStats?.find(
            (poolStat: SinglePoolDataIF) =>
                poolStat.base.toLowerCase() ===
                    baseTokenAddress.toLowerCase() &&
                poolStat.quote.toLowerCase() ===
                    quoteTokenAddress.toLowerCase(),
        );

        setLiquidityFee(currentPoolData?.feeRate || 0);
    }, [allPoolStats]);

    // Sets up the asynchronous queries to TVL, volume and liquidity curve
    useEffect(() => {
        if (
            contextMatchesParams &&
            crocEnv &&
            provider &&
            baseTokenAddress !== '' &&
            quoteTokenAddress !== '' &&
            isServerEnabled
        ) {
            // retrieve pool_positions
            const allPositionsCacheEndpoint = GCGO_OVERRIDE_URL
                ? GCGO_OVERRIDE_URL + '/pool_positions?'
                : props.graphCacheUrl + '/pool_positions?';
            fetch(
                allPositionsCacheEndpoint +
                    new URLSearchParams({
                        base: baseTokenAddress.toLowerCase(),
                        quote: quoteTokenAddress.toLowerCase(),
                        poolIdx: poolIndex.toString(),
                        chainId: chainId,
                        // n: '100',
                        n: '200',
                    }),
            )
                .then((response) => response.json())
                .then((json) => {
                    const poolPositions = json.data;
                    const skipENSFetch = true;
                    if (poolPositions) {
                        Promise.all(
                            poolPositions.map((position: PositionServerIF) => {
                                return getPositionData(
                                    position,
                                    props.searchableTokens,
                                    crocEnv,
                                    provider,
                                    chainId,
                                    props.cachedFetchTokenPrice,
                                    props.cachedQuerySpotPrice,
                                    props.cachedTokenDetails,
                                    props.cachedEnsResolve,
                                    skipENSFetch,
                                );
                            }),
                        )
                            .then((updatedPositions) => {
                                if (updatedPositions.length > 0) {
                                    setNewRangesByPoolData(updatedPositions);
                                } else {
                                    setNewRangesByPoolData(undefined);
                                    setPositionsByPool({
                                        dataReceived: false,
                                        positions: [],
                                    });
                                    setDataLoadingStatus({
                                        datasetName: 'isPoolRangeDataLoading',
                                        loadingStatus: false,
                                    });
                                }
                            })
                            .catch(console.error);
                    } else {
                        setNewRangesByPoolData(undefined);
                        setPositionsByPool({
                            dataReceived: false,
                            positions: [],
                        });
                        setDataLoadingStatus({
                            datasetName: 'isPoolRangeDataLoading',
                            loadingStatus: false,
                        });
                    }
                })
                .catch(console.error);

            // retrieve positions for leaderboard
            const poolPositionsCacheEndpoint = GCGO_OVERRIDE_URL
                ? GCGO_OVERRIDE_URL + '/pool_position_apy_leaders?'
                : props.graphCacheUrl + '/pool_position_apy_leaders?';
            fetch(
                poolPositionsCacheEndpoint +
                    new URLSearchParams({
                        base: baseTokenAddress.toLowerCase(),
                        quote: quoteTokenAddress.toLowerCase(),
                        poolIdx: poolIndex.toString(),
                        chainId: chainId,
                        n: '50',
                    }),
            )
                .then((response) => response.json())
                .then((json) => {
                    const leaderboardPositions = json.data;
                    const skipENSFetch = true;

                    if (leaderboardPositions) {
                        Promise.all(
                            leaderboardPositions.map(
                                (position: PositionServerIF) => {
                                    return getPositionData(
                                        position,
                                        props.searchableTokens,
                                        crocEnv,
                                        provider,
                                        chainId,
                                        props.cachedFetchTokenPrice,
                                        props.cachedQuerySpotPrice,
                                        props.cachedTokenDetails,
                                        props.cachedEnsResolve,
                                        skipENSFetch,
                                    );
                                },
                            ),
                        )
                            .then((updatedPositions) => {
                                const top10Positions = updatedPositions
                                    .filter((updatedPosition: PositionIF) => {
                                        return (
                                            updatedPosition.isPositionInRange &&
                                            updatedPosition.apy !== 0
                                        );
                                    })
                                    .slice(0, 10);

                                if (top10Positions.length > 0) {
                                    setNewLeaderboardByPoolData(top10Positions);
                                } else {
                                    setNewLeaderboardByPoolData(undefined);
                                }
                            })
                            .catch(console.error);
                    } else {
                        setLeaderboardByPool({
                            dataReceived: false,
                            positions: [],
                        });
                    }
                })
                .catch(console.error);

            // retrieve pool recent changes
            fetchPoolRecentChanges({
                tokenList: props.searchableTokens,
                base: baseTokenAddress,
                quote: quoteTokenAddress,
                poolIdx: poolIndex,
                chainId: chainId,
                n: 100,
                crocEnv: crocEnv,
                graphCacheUrl: props.graphCacheUrl,
                provider: provider,
                cachedFetchTokenPrice: props.cachedFetchTokenPrice,
                cachedQuerySpotPrice: props.cachedQuerySpotPrice,
                cachedTokenDetails: props.cachedTokenDetails,
                cachedEnsResolve: props.cachedEnsResolve,
            })
                .then((poolChangesJsonData) => {
                    if (poolChangesJsonData && poolChangesJsonData.length > 0) {
                        setNewTxByPoolData(poolChangesJsonData);
                    } else {
                        setNewTxByPoolData(undefined);
                        setTransactionsByPool({
                            dataReceived: true,
                            changes: [],
                        });
                        setDataLoadingStatus({
                            datasetName: 'isPoolTxDataLoading',
                            loadingStatus: false,
                        });
                    }
                })
                .catch(console.error);

            fetchPoolLimitOrders({
                tokenList: props.searchableTokens,
                base: baseTokenAddress,
                quote: quoteTokenAddress,
                poolIdx: poolIndex,
                chainId: chainId,
                n: 100,
                crocEnv: crocEnv,
                graphCacheUrl: props.graphCacheUrl,
                provider: provider,
                cachedFetchTokenPrice: props.cachedFetchTokenPrice,
                cachedQuerySpotPrice: props.cachedQuerySpotPrice,
                cachedTokenDetails: props.cachedTokenDetails,
                cachedEnsResolve: props.cachedEnsResolve,
            })
                .then((updatedLimitOrderStates) => {
                    if (
                        updatedLimitOrderStates &&
                        updatedLimitOrderStates.length > 0
                    ) {
                        const filteredData = filterLimitArray(
                            updatedLimitOrderStates,
                        );
                        setNewLimitsByPoolData(filteredData);
                    } else {
                        setNewLimitsByPoolData(undefined);
                        setLimitOrdersByPool({
                            dataReceived: false,
                            limitOrders: [],
                        });
                        setDataLoadingStatus({
                            datasetName: 'isPoolOrderDataLoading',
                            loadingStatus: false,
                        });
                    }
                })
                .catch(console.error);
            if (props.userAddress) {
                const userPoolTransactionsCacheEndpoint = GCGO_OVERRIDE_URL
                    ? GCGO_OVERRIDE_URL + '/user_pool_txs?'
                    : props.graphCacheUrl + '/user_pool_txs?';
                fetch(
                    userPoolTransactionsCacheEndpoint +
                        new URLSearchParams({
                            user: props.userAddress,
                            base: baseTokenAddress.toLowerCase(),
                            quote: quoteTokenAddress.toLowerCase(),
                            poolIdx: poolIndex.toString(),
                            chainId: chainId,
                            n: '100',
                        }),
                )
                    .then((response) => response.json())
                    .then((json) => {
                        const userPoolTransactions = json.data;
                        const skipENSFetch = true;
                        if (userPoolTransactions) {
                            Promise.all(
                                userPoolTransactions.map(
                                    (position: TransactionServerIF) => {
                                        return getTransactionData(
                                            position,
                                            props.searchableTokens,
                                            crocEnv,
                                            provider,
                                            chainId,
                                            props.cachedFetchTokenPrice,
                                            props.cachedQuerySpotPrice,
                                            props.cachedTokenDetails,
                                            props.cachedEnsResolve,
                                            skipENSFetch,
                                        );
                                    },
                                ),
                            )
                                .then((updatedTransactions) => {
                                    setUserTransactionsByPool({
                                        dataReceived: true,
                                        changes: updatedTransactions,
                                    });
                                    setDataLoadingStatus({
                                        datasetName:
                                            'isConnectedUserPoolTxDataLoading',
                                        loadingStatus: false,
                                    });
                                })
                                .catch(console.error);
                        } else {
                            setUserTransactionsByPool({
                                dataReceived: false,
                                changes: [],
                            });
                            setDataLoadingStatus({
                                datasetName: 'isConnectedUserPoolTxDataLoading',
                                loadingStatus: false,
                            });
                        }
                    })
                    .catch(console.error);

                // retrieve user_pool_positions
                const userPoolPositionsCacheEndpoint = GCGO_OVERRIDE_URL
                    ? GCGO_OVERRIDE_URL + '/user_pool_positions?'
                    : props.graphCacheUrl + '/user_pool_positions?';
                const forceOnchainLiqUpdate = true;
                fetch(
                    userPoolPositionsCacheEndpoint +
                        new URLSearchParams({
                            user: props.userAddress,
                            base: baseTokenAddress.toLowerCase(),
                            quote: quoteTokenAddress.toLowerCase(),
                            poolIdx: poolIndex.toString(),
                            chainId: chainId,
                        }),
                )
                    .then((response) => response.json())
                    .then((json) => {
                        const userPoolPositions = json.data;
                        const skipENSFetch = true;

                        if (userPoolPositions) {
                            Promise.all(
                                userPoolPositions.map(
                                    (position: PositionServerIF) => {
                                        return getPositionData(
                                            position,
                                            props.searchableTokens,
                                            crocEnv,
                                            provider,
                                            chainId,
                                            props.cachedFetchTokenPrice,
                                            props.cachedQuerySpotPrice,
                                            props.cachedTokenDetails,
                                            props.cachedEnsResolve,
                                            skipENSFetch,
                                            forceOnchainLiqUpdate,
                                        );
                                    },
                                ),
                            )
                                .then((updatedPositions) => {
                                    setUserPositionsByPool({
                                        dataReceived: true,
                                        positions: updatedPositions,
                                    });
                                    setDataLoadingStatus({
                                        datasetName:
                                            'isConnectedUserPoolRangeDataLoading',
                                        loadingStatus: false,
                                    });
                                })
                                .catch(console.error);
                        } else {
                            setUserPositionsByPool({
                                dataReceived: false,
                                positions: [],
                            });
                            setDataLoadingStatus({
                                datasetName:
                                    'isConnectedUserPoolRangeDataLoading',
                                loadingStatus: false,
                            });
                        }
                    })
                    .catch(console.error);

                // retrieve user_pool_limit_orders
                const userPoolLimitOrdersCacheEndpoint = GCGO_OVERRIDE_URL
                    ? GCGO_OVERRIDE_URL + '/user_pool_limit_orders?'
                    : props.graphCacheUrl + '/user_pool_limit_orders?';
                fetch(
                    userPoolLimitOrdersCacheEndpoint +
                        new URLSearchParams({
                            user: props.userAddress,
                            base: baseTokenAddress.toLowerCase(),
                            quote: quoteTokenAddress.toLowerCase(),
                            poolIdx: poolIndex.toString(),
                            chainId: chainId,
                        }),
                )
                    .then((response) => response?.json())
                    .then((json) => {
                        const userPoolLimitOrderStates = json?.data;
                        if (userPoolLimitOrderStates) {
                            Promise.all(
                                userPoolLimitOrderStates.map(
                                    (limitOrder: LimitOrderServerIF) => {
                                        return getLimitOrderData(
                                            limitOrder,
                                            props.searchableTokens,
                                            crocEnv,
                                            provider,
                                            chainId,
                                            props.cachedFetchTokenPrice,
                                            props.cachedQuerySpotPrice,
                                            props.cachedTokenDetails,
                                            props.cachedEnsResolve,
                                        );
                                    },
                                ),
                            ).then((updatedLimitOrderStates) => {
                                const filteredData = filterLimitArray(
                                    updatedLimitOrderStates,
                                );
                                setUserLimitOrdersByPool({
                                    dataReceived: true,
                                    limitOrders: filteredData,
                                });

                                setDataLoadingStatus({
                                    datasetName:
                                        'isConnectedUserPoolOrderDataLoading',
                                    loadingStatus: false,
                                });
                            });
                        } else {
                            setUserLimitOrdersByPool({
                                dataReceived: false,
                                limitOrders: [],
                            });
                            setDataLoadingStatus({
                                datasetName:
                                    'isConnectedUserPoolOrderDataLoading',
                                loadingStatus: false,
                            });
                        }
                    })
                    .catch(console.error);
            }
        }
    }, [
        props.userAddress,
        props.receiptCount,
        contextMatchesParams,
        crocEnv,
        baseTokenAddress !== '' && quoteTokenAddress !== '',
        chainId,
        props.searchableTokens,
        isUserIdle
            ? Math.floor(Date.now() / 60000) // cache for 60 seconds if idle
            : Math.floor(Date.now() / 10000), // cache for 10 seconds if not idle
        provider,
        isServerEnabled,
    ]);

    const updateLiquidity = () => {
        // Reset existing liquidity data until the fetch completes, because it's a new pool
        const request = {
            baseAddress: baseTokenAddress,
            quoteAddress: quoteTokenAddress,
            chainId: chainId,
            poolIndex: poolIndex,
        };

        if (crocEnv && baseTokenAddress && quoteTokenAddress) {
            fetchPoolLiquidity(
                chainId,
                baseTokenAddress.toLowerCase(),
                quoteTokenAddress.toLowerCase(),
                poolIndex,
                crocEnv,
                props.graphCacheUrl,
                props.cachedFetchTokenPrice,
                props.cachedQuerySpotTick,
                currentPoolPriceTick,
            )
                .then((liqCurve) => {
                    if (liqCurve) {
                        setLiquidity(liqCurve, request);
                    }
                })
                .catch(console.error);
        }
    };

    const totalPositionLiq = useMemo(
        () =>
            positionsByPool.positions.reduce((sum, position) => {
                return sum + position.positionLiq;
            }, 0) +
            limitOrdersByPool.limitOrders.reduce((sum, order) => {
                return sum + order.positionLiq;
            }, 0),
        [positionsByPool, limitOrdersByPool],
    );

    useEffect(() => {
        if (
            currentPoolPriceTick &&
            totalPositionLiq &&
            Math.abs(currentPoolPriceTick) !== Infinity
        )
            updateLiquidity();
    }, [
        currentPoolPriceTick,
        totalPositionLiq,
        crocEnv === undefined,
        baseTokenAddress !== '' && quoteTokenAddress !== '',
    ]);
    return {
        contextMatchesParams,
        baseTokenAddress,
        quoteTokenAddress,
        baseTokenDecimals, // Token contract decimals
        quoteTokenDecimals, // Token contract decimals
        isTokenABase, // True if the base token is the first token in the panel (e.g. sell token on swap)
    };
}
