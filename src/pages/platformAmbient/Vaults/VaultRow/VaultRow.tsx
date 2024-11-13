import styles from './VaultRow.module.css';
import tempestLogoColor from './tempestLogoColor.svg';
// import tempestLogo from './tempestLogo.svg';
import { FlexContainer } from '../../../../styled/Common';
import {
    getFormattedNumber,
    uriToHttp,
} from '../../../../ambient-utils/dataLayer';
import TokenIcon from '../../../../components/Global/TokenIcon/TokenIcon';
import useMediaQuery from '../../../../utils/hooks/useMediaQuery';
import { useModal } from '../../../../components/Global/Modal/useModal';
import { VaultIF } from '../../../../ambient-utils/types';
import { useContext, useState } from 'react';
import {
    AppStateContext,
    UserDataContext,
    TokenContext,
} from '../../../../contexts';
import { formatDollarAmount } from '../../../../utils/numbers';
import VaultDeposit from '../VaultActionModal/VaultDeposit/VaultDeposit';
import VaultWithdraw from '../VaultActionModal/VaultWithdraw/VaultWithdraw';
import { RiExternalLinkLine } from 'react-icons/ri';

interface propsIF {
    idForDOM: string;
    vault: VaultIF;
}
export default function VaultRow(props: propsIF) {
    const { idForDOM, vault } = props;
    const [isOpen, openModal, closeModal] = useModal();
    const [type, setType] = useState<'Deposit' | 'Withdraw'>('Deposit');

    const { tokens } = useContext(TokenContext);
    const { isUserConnected } = useContext(UserDataContext);

    const {
        activeNetwork: { chainId },
    } = useContext(AppStateContext);

    const token0 = tokens.getTokenByAddress(vault.token0Address);
    const token1 = tokens.getTokenByAddress(vault.token1Address);

    const showMobileVersion = useMediaQuery('(max-width: 768px)');

    if (Number(chainId) !== vault.chainId || !token0 || !token1) {
        return null;
    }

    const tokenIconsDisplay = (
        <FlexContainer alignItems='center' gap={5} style={{ flexShrink: 0 }}>
            <div className={styles.tempestDisplay}>
                <img src={tempestLogoColor} alt='tempest' />
            </div>
            <TokenIcon
                token={token1}
                src={uriToHttp(token1.logoURI)}
                alt={token1.symbol}
                size={showMobileVersion ? 'm' : '2xl'}
            />
            <TokenIcon
                token={token0}
                src={uriToHttp(token0.logoURI)}
                alt={token0.symbol}
                size={showMobileVersion ? 'm' : '2xl'}
            />
        </FlexContainer>
    );

    const depositsDisplay = (
        <FlexContainer
            alignItems='flex-end'
            flexDirection='column'
            justifyContent='flex-end'
            gap={5}
            style={{ flexShrink: 0 }}
            className={styles.depositContainer}
        >
            <FlexContainer flexDirection='row' alignItems='center' gap={4}>
                1,000
                <TokenIcon
                    token={token1}
                    src={uriToHttp(token1.logoURI)}
                    alt={token1.symbol}
                    size={'m'}
                />
            </FlexContainer>
        </FlexContainer>
    );

    const formattedAPR = getFormattedNumber({
        value: parseFloat(vault.apr),
        prefix: '',
        suffix: '%',
        minFracDigits: 2,
        maxFracDigits: 2,
    });

    function handleOpenWithdrawModal() {
        setType('Withdraw')
        openModal()
    }
    function handleOpenDepositModal() {
        setType('Deposit')
        openModal()
    }

    const modalToOpen = type === 'Deposit' ? <VaultDeposit token0={token0} token1={token1} onClose={closeModal} /> :
        <VaultWithdraw token0={token0} token1={token1} onClose={closeModal}/>
    function navigateExternal(): void {
        const goToExternal = (url: string) => window.open(url, '_blank');
        if (vault.chainId === 534352) {
            const destination: string = 'https://app.tempestdev.xyz/vaults/ethereum/' + vault.address;
            goToExternal(destination);
        } else if (vault.chainId === 1) {
            const destination: string = 'https://app.tempestdev.xyz/vaults/scroll/' + vault.address;
            goToExternal(destination);
        }
    }

    return (
        <>
            <div id={idForDOM} className={styles.mainContainer}>
                <div className={styles.contentColumn}>
                    <div className={styles.mainContent}>
                        {tokenIconsDisplay}
                        <p
                            className={styles.poolName}
                            onClick={() => navigateExternal()}
                        >
                            <span>{token1.symbol} / {token0.symbol}</span>
                            <RiExternalLinkLine size={20} />
                        </p>
                        <p className={styles.tvlDisplay}>
                            {formatDollarAmount(parseFloat(vault.tvlUsd))}
                        </p>
                        {depositsDisplay}
                        <p
                            className={styles.apyDisplay}
                            style={{ color: 'var(--other-green' }}
                        >
                            {formattedAPR}
                        </p>
                        <div className={styles.actionButtonContainer}>
                            <button
                                className={styles.actionButton}
                                onClick={handleOpenDepositModal}
                            >
                                Deposit
                            </button>
                            {isUserConnected && (
                                <button
                                    className={styles.actionButton}
                                    onClick={handleOpenWithdrawModal}
                                >
                                    Withdraw
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {isOpen && modalToOpen}
        </>
    );
}
