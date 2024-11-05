import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
    ReactNode,
} from 'react';
import { fetchUserRecentChanges, fetchRecords } from '../ambient-utils/api';
import {
    TokenIF,
    PositionIF,
    LimitOrderIF,
    TransactionIF,
    LiquidityDataIF,
    RecordType,
} from '../ambient-utils/types';
import { AppStateContext, AppStateContextIF } from './AppStateContext';
import { CachedDataContext, CachedDataContextIF } from './CachedDataContext';
import { CrocEnvContext, CrocEnvContextIF } from './CrocEnvContext';
import { TokenContext, TokenContextIF } from './TokenContext';
import { UserDataContext, UserDataContextIF } from './UserDataContext';
import { DataLoadingContext, DataLoadingContextIF } from './DataLoadingContext';
import {
    PositionUpdateIF,
    ReceiptContext,
    ReceiptContextIF,
} from './ReceiptContext';
import { getPositionHash } from '../ambient-utils/dataLayer/functions/getPositionHash';
import { TradeDataContext, TradeDataContextIF } from './TradeDataContext';

interface Changes {
    dataReceived: boolean;
    changes: Array<TransactionIF>;
}

interface PositionsByUser {
    dataReceived: boolean;
    positions: Array<PositionIF>;
}
interface LimitOrdersByUser {
    dataReceived: boolean;
    limitOrders: LimitOrderIF[];
}
interface PositionsByPool {
    dataReceived: boolean;
    positions: Array<PositionIF>;
}
interface LimitOrdersByPool {
    dataReceived: boolean;
    limitOrders: LimitOrderIF[];
}
interface PoolRequestParams {
    baseAddress: string;
    quoteAddress: string;
    poolIndex: number;
    chainId: string;
}

export interface GraphDataContextIF {
    positionsByUser: PositionsByUser;
    limitOrdersByUser: LimitOrdersByUser;
    transactionsByUser: Changes;
    userTransactionsByPool: Changes;
    unindexedNonFailedSessionTransactionHashes: string[];
    unindexedNonFailedSessionPositionUpdates: PositionUpdateIF[];
    unindexedNonFailedSessionLimitOrderUpdates: PositionUpdateIF[];
    transactionsByPool: Changes;
    userPositionsByPool: PositionsByPool;
    positionsByPool: PositionsByPool;
    leaderboardByPool: PositionsByPool;
    userLimitOrdersByPool: LimitOrdersByPool;
    limitOrdersByPool: LimitOrdersByPool;
    liquidityData: LiquidityDataIF | undefined;
    liquidityFee: number;

    setLiquidityPending: (params: PoolRequestParams) => void;
    setLiquidity: (
        liqData: LiquidityDataIF,
        request: PoolRequestParams | undefined,
    ) => void;
    setLiquidityFee: React.Dispatch<React.SetStateAction<number>>;
    setTransactionsByPool: React.Dispatch<React.SetStateAction<Changes>>;
    setTransactionsByUser: React.Dispatch<React.SetStateAction<Changes>>;
    setUserTransactionsByPool: React.Dispatch<React.SetStateAction<Changes>>;
    setUserPositionsByPool: React.Dispatch<
        React.SetStateAction<PositionsByPool>
    >;
    setPositionsByPool: React.Dispatch<React.SetStateAction<PositionsByPool>>;
    setLeaderboardByPool: React.Dispatch<React.SetStateAction<PositionsByPool>>;
    setUserLimitOrdersByPool: React.Dispatch<
        React.SetStateAction<LimitOrdersByPool>
    >;
    setLimitOrdersByPool: React.Dispatch<
        React.SetStateAction<LimitOrdersByPool>
    >;
    resetUserGraphData: () => void;
}

function normalizeAddr(addr: string): string {
    const caseAddr = addr.toLowerCase();
    return caseAddr.startsWith('0x') ? caseAddr : '0x' + caseAddr;
}

export const GraphDataContext = createContext<GraphDataContextIF>(
    {} as GraphDataContextIF,
);

export const GraphDataContextProvider = (props: { children: ReactNode }) => {
    const {
        activeNetwork: { graphCacheUrl, chainId },
        server: { isEnabled: isServerEnabled },
        isUserIdle,
    } = useContext<AppStateContextIF>(AppStateContext);
    const { baseToken, quoteToken } =
        useContext<TradeDataContextIF>(TradeDataContext);
    const { pendingTransactions, allReceipts, sessionPositionUpdates } =
        useContext<ReceiptContextIF>(ReceiptContext);
    const { setDataLoadingStatus } =
        useContext<DataLoadingContextIF>(DataLoadingContext);
    const {
        cachedQuerySpotPrice,
        cachedFetchTokenPrice,
        cachedTokenDetails,
        cachedEnsResolve,
    } = useContext<CachedDataContextIF>(CachedDataContext);
    const { crocEnv, provider } = useContext<CrocEnvContextIF>(CrocEnvContext);
    const { tokens } = useContext<TokenContextIF>(TokenContext);
    const { userAddress: userDefaultAddress, isUserConnected } =
        useContext<UserDataContextIF>(UserDataContext);

    const [positionsByUser, setPositionsByUser] = useState<PositionsByUser>({
        dataReceived: false,
        positions: [],
    });
    const [limitOrdersByUser, setLimitOrdersByUser] =
        useState<LimitOrdersByUser>({
            dataReceived: false,
            limitOrders: [],
        });
    const [transactionsByUser, setTransactionsByUser] = useState<Changes>({
        dataReceived: false,
        changes: [],
    });
    const [userPositionsByPool, setUserPositionsByPool] =
        useState<PositionsByPool>({
            dataReceived: false,
            positions: [],
        });
    const [userTransactionsByPool, setUserTransactionsByPool] =
        useState<Changes>({
            dataReceived: false,
            changes: [],
        });

    const [positionsByPool, setPositionsByPool] = useState<PositionsByPool>({
        dataReceived: false,
        positions: [],
    });
    const [leaderboardByPool, setLeaderboardByPool] = useState<PositionsByPool>(
        {
            dataReceived: false,
            positions: [],
        },
    );
    const [transactionsByPool, setTransactionsByPool] = useState<Changes>({
        dataReceived: false,
        changes: [],
    });

    const [userLimitOrdersByPool, setUserLimitOrdersByPool] =
        useState<LimitOrdersByPool>({
            dataReceived: false,
            limitOrders: [],
        });
    const [limitOrdersByPool, setLimitOrdersByPool] =
        useState<LimitOrdersByPool>({
            dataReceived: false,
            limitOrders: [],
        });

    const [liquidityData, setLiquidityData] = useState<
        LiquidityDataIF | undefined
    >(undefined);

    const [liquidityFee, setLiquidityFee] = useState<number>(0);

    const userAddress = userDefaultAddress;

    const resetUserGraphData = () => {
        setPositionsByUser({
            dataReceived: false,
            positions: [],
        });
        setLimitOrdersByUser({
            dataReceived: false,
            limitOrders: [],
        });
        setTransactionsByUser({
            dataReceived: false,
            changes: [],
        });
        setUserPositionsByPool({
            dataReceived: false,
            positions: [],
        });
        setUserLimitOrdersByPool({
            dataReceived: false,
            limitOrders: [],
        });
        setUserTransactionsByPool({
            dataReceived: false,
            changes: [],
        });
        setSessionTransactionHashes([]);
    };

    const resetPoolGraphData = () => {
        setTransactionsByPool({
            dataReceived: false,
            changes: [],
        });
        setPositionsByPool({
            dataReceived: false,
            positions: [],
        });
        setLeaderboardByPool({
            dataReceived: false,
            positions: [],
        });
        setLimitOrdersByPool({
            dataReceived: false,
            limitOrders: [],
        });
    };

    const setLiquidity = (
        liqData: LiquidityDataIF,
        request: PoolRequestParams | undefined,
    ) => {
        // Sanitize the raw result from the backend
        const base = normalizeAddr(liqData.curveState.base);
        const quote = normalizeAddr(liqData.curveState.quote);
        const chainId = liqData.curveState.chainId;
        const curveState = { ...liqData.curveState, base, quote, chainId };

        // Verify that the result matches the current request in case multiple are in-flight
        if (
            request?.baseAddress.toLowerCase() === base &&
            request?.quoteAddress.toLowerCase() === quote &&
            request?.poolIndex === liqData.curveState.poolIdx &&
            request?.chainId === chainId
        ) {
            setLiquidityData({ ...liqData, curveState });
        } else {
            console.warn(
                'Discarding mismatched liquidity curve request',
                base,
                quote,
                chainId,
            );
        }
    };

    const setLiquidityPending = () => {
        setLiquidityData(undefined);
    };

    const [sessionTransactionHashes, setSessionTransactionHashes] = useState<
        string[]
    >([]);

    useEffect(() => {
        resetUserGraphData();
    }, [isUserConnected, userAddress]);

    useEffect(() => {
        resetPoolGraphData();
    }, [baseToken.address + quoteToken.address]);

    useEffect(() => {
        setUserPositionsByPool({
            dataReceived: false,
            positions: [],
        });
        setUserLimitOrdersByPool({
            dataReceived: false,
            limitOrders: [],
        });
        setUserTransactionsByPool({
            dataReceived: false,
            changes: [],
        });
    }, [baseToken.address + quoteToken.address]);

    const txsByUserHashArray = useMemo(
        () =>
            transactionsByUser.changes
                .concat(userTransactionsByPool.changes)
                .map((change) => change.txHash),
        [transactionsByUser, userTransactionsByPool],
    );

    const positionsByUserIndexUpdateArray: PositionUpdateIF[] = useMemo(
        () =>
            positionsByUser.positions
                .concat(userPositionsByPool.positions)
                .map((position) => {
                    return {
                        positionID: getPositionHash(position),
                        isLimit: false,
                        unixTimeIndexed: position.latestUpdateTime,
                    };
                }),
        [positionsByUser, userPositionsByPool],
    );

    const limitOrdersByUserIndexUpdateArray: PositionUpdateIF[] = useMemo(
        () =>
            limitOrdersByUser.limitOrders
                .concat(userLimitOrdersByPool.limitOrders)
                .map((limitOrder) => {
                    const posHash = getPositionHash(undefined, {
                        isPositionTypeAmbient: false,
                        user: limitOrder.user,
                        baseAddress: limitOrder.base,
                        quoteAddress: limitOrder.quote,
                        poolIdx: limitOrder.poolIdx,
                        bidTick: limitOrder.bidTick,
                        askTick: limitOrder.askTick,
                    });
                    return {
                        positionID: posHash,
                        isLimit: true,
                        unixTimeIndexed: limitOrder.latestUpdateTime,
                    };
                }),
        [limitOrdersByUser, userLimitOrdersByPool],
    );

    useEffect(() => {
        for (let i = 0; i < pendingTransactions.length; i++) {
            const pendingTx = pendingTransactions[i];
            setSessionTransactionHashes((prev) => {
                if (!prev.includes(pendingTx)) {
                    return [pendingTx, ...prev];
                } else return prev;
            });
        }
    }, [pendingTransactions]);

    const unindexedSessionTransactionHashes = sessionTransactionHashes.filter(
        (tx) => !txsByUserHashArray.includes(tx),
    );

    const failedSessionTransactionHashes = allReceipts
        .filter((r) => JSON.parse(r).status === 0)
        .map((r) => JSON.parse(r).hash);

    const unixTimeOffset = 10; // 10s offset needed to account for system clock differences

    // transaction hashes for subsequently fully removed positions
    const removedPositionUpdateTxHashes = useMemo(
        () =>
            sessionPositionUpdates
                .filter((pos1) =>
                    sessionPositionUpdates.some((pos2) => {
                        return (
                            pos1.positionID === pos2.positionID &&
                            pos2.isFullRemoval &&
                            (pos2.unixTimeReceipt || 0) >
                                (pos1.unixTimeAdded || 0)
                        );
                    }),
                )
                .map((removedTx) => removedTx.txHash),
        [sessionPositionUpdates],
    );

    const unindexedNonFailedSessionTransactionHashes = useMemo(
        () =>
            unindexedSessionTransactionHashes.filter(
                (tx) => !failedSessionTransactionHashes.includes(tx),
            ),
        [unindexedSessionTransactionHashes, failedSessionTransactionHashes],
    );

    const unindexedNonFailedSessionPositionUpdates = useMemo(
        () =>
            sessionPositionUpdates.filter(
                (positionUpdate) =>
                    positionUpdate.isLimit === false &&
                    !failedSessionTransactionHashes.includes(
                        positionUpdate.txHash,
                    ) &&
                    !removedPositionUpdateTxHashes.includes(
                        positionUpdate.txHash,
                    ) &&
                    !positionsByUserIndexUpdateArray.some(
                        (userPositionIndexUpdate) =>
                            userPositionIndexUpdate.positionID ===
                                positionUpdate.positionID &&
                            (userPositionIndexUpdate.unixTimeIndexed || 0) +
                                unixTimeOffset >=
                                (positionUpdate.unixTimeAdded || 0),
                    ),
            ),
        [
            sessionPositionUpdates,
            failedSessionTransactionHashes,
            removedPositionUpdateTxHashes,
            positionsByUserIndexUpdateArray,
        ],
    );

    const unindexedNonFailedSessionLimitOrderUpdates = useMemo(
        () =>
            sessionPositionUpdates.filter(
                (positionUpdate) =>
                    positionUpdate.isLimit === true &&
                    !failedSessionTransactionHashes.includes(
                        positionUpdate.txHash,
                    ) &&
                    !removedPositionUpdateTxHashes.includes(
                        positionUpdate.txHash,
                    ) &&
                    !limitOrdersByUserIndexUpdateArray.some(
                        (userPositionIndexUpdate) =>
                            userPositionIndexUpdate.positionID ===
                                positionUpdate.positionID &&
                            (userPositionIndexUpdate.unixTimeIndexed || 0) +
                                unixTimeOffset >=
                                (positionUpdate.unixTimeAdded || 0),
                    ),
            ),
        [
            sessionPositionUpdates,
            failedSessionTransactionHashes,
            limitOrdersByUserIndexUpdateArray,
        ],
    );

    const onAccountRoute = location.pathname.includes('account');

    const userDataByPoolLength = useMemo(
        () =>
            transactionsByUser.changes.length +
            userLimitOrdersByPool.limitOrders.length +
            userPositionsByPool.positions.length,
        [transactionsByUser, userLimitOrdersByPool, userPositionsByPool],
    );

    useEffect(() => {
        const fetchData = async () => {
            // This useEffect controls a series of other dispatches that fetch data on update of the user object
            // user Postions, limit orders, and recent changes are all governed here
            if (
                !isServerEnabled ||
                !isUserConnected ||
                !userAddress ||
                !crocEnv ||
                !provider ||
                !tokens.tokenUniv.length ||
                !chainId
            ) {
                return;
            }
            const recordTargets = [RecordType.Position, RecordType.LimitOrder];
            for (let i = 0; i < recordTargets.length; i++) {
                try {
                    const updatedLedger = await fetchRecords({
                        recordType: recordTargets[i],
                        user: userAddress,
                        chainId: chainId,
                        gcUrl: graphCacheUrl,
                        provider,
                        tokenUniv: tokens.tokenUniv,
                        crocEnv,
                        cachedFetchTokenPrice,
                        cachedQuerySpotPrice,
                        cachedTokenDetails,
                        cachedEnsResolve,
                    });

                    if (recordTargets[i] == RecordType.Position) {
                        setPositionsByUser({
                            dataReceived: true,
                            positions: updatedLedger as PositionIF[],
                        });
                        setDataLoadingStatus({
                            datasetName: 'isConnectedUserRangeDataLoading',
                            loadingStatus: false,
                        });
                    } else {
                        // default user_positions
                        setLimitOrdersByUser({
                            dataReceived: true,
                            limitOrders: updatedLedger as LimitOrderIF[],
                        }),
                            setDataLoadingStatus({
                                datasetName: 'isConnectedUserOrderDataLoading',
                                loadingStatus: false,
                            });
                    }
                } catch (error) {
                    console.error(error);
                }
            }

            try {
                fetchUserRecentChanges({
                    tokenList: tokens.tokenUniv,
                    user: userAddress,
                    chainId: chainId,
                    crocEnv: crocEnv,
                    graphCacheUrl: graphCacheUrl,
                    provider,
                    n: 200, // fetch last 200 changes,
                    cachedFetchTokenPrice: cachedFetchTokenPrice,
                    cachedQuerySpotPrice: cachedQuerySpotPrice,
                    cachedTokenDetails: cachedTokenDetails,
                    cachedEnsResolve: cachedEnsResolve,
                })
                    .then((updatedTransactions) => {
                        if (updatedTransactions) {
                            setTransactionsByUser({
                                dataReceived: true,
                                changes: updatedTransactions,
                            });
                            const result: TokenIF[] = [];
                            const tokenMap = new Map();
                            for (const item of updatedTransactions as TransactionIF[]) {
                                if (!tokenMap.has(item.base)) {
                                    const isFoundInAmbientList =
                                        tokens.defaultTokens.some(
                                            (ambientToken) => {
                                                if (
                                                    ambientToken.address.toLowerCase() ===
                                                    item.base.toLowerCase()
                                                )
                                                    return true;
                                                return false;
                                            },
                                        );
                                    if (!isFoundInAmbientList) {
                                        tokenMap.set(item.base, true); // set any value to Map
                                        result.push({
                                            name: item.baseName,
                                            address: item.base,
                                            symbol: item.baseSymbol,
                                            decimals: item.baseDecimals,
                                            chainId: parseInt(item.chainId),
                                            logoURI: item.baseTokenLogoURI,
                                        });
                                    }
                                }
                                if (!tokenMap.has(item.quote)) {
                                    const isFoundInAmbientList =
                                        tokens.defaultTokens.some(
                                            (ambientToken) => {
                                                if (
                                                    ambientToken.address.toLowerCase() ===
                                                    item.quote.toLowerCase()
                                                )
                                                    return true;
                                                return false;
                                            },
                                        );
                                    if (!isFoundInAmbientList) {
                                        tokenMap.set(item.quote, true); // set any value to Map
                                        result.push({
                                            name: item.quoteName,
                                            address: item.quote,
                                            symbol: item.quoteSymbol,
                                            decimals: item.quoteDecimals,
                                            chainId: parseInt(item.chainId),
                                            logoURI: item.quoteTokenLogoURI,
                                        });
                                    }
                                }
                            }
                        }

                        setDataLoadingStatus({
                            datasetName: 'isConnectedUserTxDataLoading',
                            loadingStatus: false,
                        });
                    })
                    .catch(console.error);
            } catch (error) {
                console.error;
            }
        };
        fetchData();
    }, [
        isServerEnabled,
        tokens.tokenUniv.length,
        isUserConnected,
        userAddress,
        chainId,
        isUserIdle
            ? Math.floor(Date.now() / (onAccountRoute ? 60000 : 120000))
            : Math.floor(Date.now() / (onAccountRoute ? 15000 : 60000)), // cache every 15 seconds while viewing portfolio, otherwise 1 minute
        !!crocEnv,
        !!provider,
        userDataByPoolLength,
        allReceipts.length,
    ]);

    const graphDataContext: GraphDataContextIF = {
        positionsByUser,
        limitOrdersByUser,
        transactionsByUser,
        userPositionsByPool,
        userTransactionsByPool,
        unindexedNonFailedSessionTransactionHashes,
        unindexedNonFailedSessionPositionUpdates,
        unindexedNonFailedSessionLimitOrderUpdates,
        resetUserGraphData,
        setTransactionsByUser,
        setUserPositionsByPool,
        setUserTransactionsByPool,
        positionsByPool,
        leaderboardByPool,
        setPositionsByPool,
        setLeaderboardByPool,
        transactionsByPool,
        setTransactionsByPool,
        userLimitOrdersByPool,
        setUserLimitOrdersByPool,
        limitOrdersByPool,
        setLimitOrdersByPool,
        liquidityData,
        setLiquidity,
        setLiquidityPending,
        liquidityFee,
        setLiquidityFee,
    };

    return (
        <GraphDataContext.Provider value={graphDataContext}>
            {props.children}
        </GraphDataContext.Provider>
    );
};
