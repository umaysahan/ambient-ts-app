import styles from '../TransactionDetailsModal.module.css';
import { useState, useRef, useContext, useEffect, memo } from 'react';
import TransactionDetailsPriceInfo from './TransactionDetailsPriceInfo/TransactionDetailsPriceInfo';
import {
    TransactionIF,
    PositionServerIF,
} from '../../../../ambient-utils/types';
import TransactionDetailsSimplify from './TransactionDetailsSimplify/TransactionDetailsSimplify';
import useCopyToClipboard from '../../../../utils/hooks/useCopyToClipboard';
import {
    AppStateContext,
    AppStateContextIF,
} from '../../../../contexts/AppStateContext';
import modalBackground from '../../../../assets/images/backgrounds/background.png';

import {
    CACHE_UPDATE_FREQ_IN_MS,
    GCGO_OVERRIDE_URL,
} from '../../../../ambient-utils/constants';
import {
    CrocEnvContext,
    CrocEnvContextIF,
} from '../../../../contexts/CrocEnvContext';
import {
    getPositionData,
    printDomToImage,
} from '../../../../ambient-utils/dataLayer';
import {
    TokenContext,
    TokenContextIF,
} from '../../../../contexts/TokenContext';
import {
    CachedDataContext,
    CachedDataContextIF,
} from '../../../../contexts/CachedDataContext';
import Modal from '../../Modal/Modal';
import DetailsHeader from '../DetailsHeader/DetailsHeader';
import ModalHeader from '../../ModalHeader/ModalHeader';
import useMediaQuery from '../../../../utils/hooks/useMediaQuery';
import TransactionDetailsGraph from '../TransactionDetailsGraph/TransactionDetailsGraph';
import MobileDetailTabs from '../MobileDetailTabs/MobileDetailTabs';

interface propsIF {
    tx: TransactionIF;
    isBaseTokenMoneynessGreaterOrEqual: boolean;
    isAccountView: boolean;
    onClose: () => void;
}

function TransactionDetailsModal(props: propsIF) {
    const showMobileVersion = useMediaQuery('(max-width: 768px)');

    const { tx, isBaseTokenMoneynessGreaterOrEqual, isAccountView, onClose } =
        props;
    const {
        activeNetwork: { chainId, graphCacheUrl },
        snackbar: { open: openSnackbar },
    } = useContext<AppStateContextIF>(AppStateContext);

    const {
        cachedQuerySpotPrice,
        cachedFetchTokenPrice,
        cachedTokenDetails,
        cachedEnsResolve,
    } = useContext<CachedDataContextIF>(CachedDataContext);

    const { crocEnv, provider } = useContext<CrocEnvContextIF>(CrocEnvContext);

    const { tokens } = useContext<TokenContextIF>(TokenContext);

    const [updatedPositionApy, setUpdatedPositionApy] = useState<
        number | undefined
    >();

    useEffect(() => {
        if (tx.entityType !== 'liqchange') return;

        const positionStatsCacheEndpoint = GCGO_OVERRIDE_URL
            ? GCGO_OVERRIDE_URL + '/position_stats?'
            : graphCacheUrl + '/position_stats?';

        fetch(
            positionStatsCacheEndpoint +
                new URLSearchParams({
                    user: tx.user,
                    bidTick: tx.bidTick.toString(),
                    askTick: tx.askTick.toString(),
                    base: tx.base,
                    quote: tx.quote,
                    poolIdx: tx.poolIdx.toString(),
                    chainId: chainId,
                    positionType: tx.positionType,
                }),
        )
            .then((response) => response?.json())
            .then(async (json) => {
                if (!crocEnv || !provider || !json?.data) {
                    return;
                }
                // temporarily skip ENS fetch
                const skipENSFetch = true;
                const forceOnchainLiqUpdate = false;

                const positionPayload = json?.data as PositionServerIF;
                const positionStats = await getPositionData(
                    positionPayload,
                    tokens.tokenUniv,
                    crocEnv,
                    provider,
                    chainId,
                    cachedFetchTokenPrice,
                    cachedQuerySpotPrice,
                    cachedTokenDetails,
                    cachedEnsResolve,
                    skipENSFetch,
                    forceOnchainLiqUpdate,
                );

                if (positionStats.timeFirstMint) {
                    tx.timeFirstMint = positionStats.timeFirstMint;
                }

                setUpdatedPositionApy(positionStats.aprEst * 100);
            })
            .catch(console.error);
    }, [
        Math.floor(Date.now() / CACHE_UPDATE_FREQ_IN_MS),
        !!crocEnv,
        !!provider,
        chainId,
    ]);

    const [showShareComponent, setShowShareComponent] = useState<boolean>(true);

    const detailsRef = useRef(null);

    const copyTransactionDetailsToClipboard = async () => {
        if (detailsRef.current) {
            const blob = await printDomToImage(detailsRef.current, '#0d1117', {
                background: `url(${modalBackground}) no-repeat`,
                backgroundSize: 'cover',
            });
            if (blob) {
                copy(blob);
                openSnackbar('Shareable image copied to clipboard', 'info');
            }
        }
    };

    const [controlItems] = useState([
        { slug: 'ticks', name: 'Show ticks', checked: true },
        { slug: 'liquidity', name: 'Show Liquidity', checked: true },
        { slug: 'value', name: 'Show value', checked: true },
    ]);

    const [_, copy] = useCopyToClipboard();

    function handleCopyAddress() {
        const txHash = tx.txHash;
        copy(txHash);
        openSnackbar(`${txHash} copied`, 'info');
    }

    const [timeFirstMintMemo, setTimeFirstMintMemo] = useState<
        number | undefined
    >(tx.timeFirstMint);

    useEffect(() => {
        if (tx.timeFirstMint) {
            setTimeFirstMintMemo(tx.timeFirstMint);
        }
    }, [tx.timeFirstMint]);

    const shareComponent = (
        <div ref={detailsRef} className={styles.main_outer_container}>
            <div className={styles.main_content}>
                <div className={styles.left_container}>
                    <TransactionDetailsPriceInfo
                        tx={tx}
                        controlItems={controlItems}
                        positionApy={updatedPositionApy}
                        isAccountView={isAccountView}
                    />
                </div>
                <div className={styles.right_container}>
                    <TransactionDetailsGraph
                        tx={tx}
                        // timeFirstMint={timeFirstMint}
                        transactionType={tx.entityType}
                        isBaseTokenMoneynessGreaterOrEqual={
                            isBaseTokenMoneynessGreaterOrEqual
                        }
                        isAccountView={isAccountView}
                        timeFirstMintMemo={timeFirstMintMemo}
                    />
                </div>
            </div>
        </div>
    );

    const shareComponentMobile = (
        <Modal usingCustomHeader onClose={onClose}>
            <div className={styles.transaction_details_mobile}>
                <ModalHeader title={'Transaction Details'} onClose={onClose} />
                <MobileDetailTabs
                    showShareComponent={showShareComponent}
                    setShowShareComponent={setShowShareComponent}
                />
                {!showShareComponent ? (
                    <TransactionDetailsSimplify
                        tx={tx}
                        isAccountView={isAccountView}
                        timeFirstMintMemo={timeFirstMintMemo}
                    />
                ) : (
                    <div className={styles.mobile_price_graph_container}>
                        <TransactionDetailsPriceInfo
                            tx={tx}
                            controlItems={controlItems}
                            positionApy={updatedPositionApy}
                            isAccountView={isAccountView}
                        />
                        <div className={styles.graph_section_mobile}>
                            <TransactionDetailsGraph
                                tx={tx}
                                transactionType={tx.entityType}
                                isBaseTokenMoneynessGreaterOrEqual={
                                    isBaseTokenMoneynessGreaterOrEqual
                                }
                                isAccountView={isAccountView}
                                timeFirstMintMemo={timeFirstMintMemo}
                            />
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );

    if (showMobileVersion) return shareComponentMobile;

    return (
        <Modal usingCustomHeader onClose={onClose}>
            <div className={styles.outer_container}>
                <DetailsHeader
                    onClose={onClose}
                    handleCopyAction={handleCopyAddress}
                    copyToClipboard={copyTransactionDetailsToClipboard}
                    showShareComponent={showShareComponent}
                    setShowShareComponent={setShowShareComponent}
                    tooltipCopyAction='Copy transaction hash to clipboard'
                    tooltipCopyImage='Copy shareable image'
                />
                {showShareComponent ? (
                    shareComponent
                ) : (
                    <TransactionDetailsSimplify
                        tx={tx}
                        isAccountView={isAccountView}
                        timeFirstMintMemo={timeFirstMintMemo}
                    />
                )}
            </div>
        </Modal>
    );
}

export default memo(TransactionDetailsModal);