// START: Import React and Dongles
import { memo, useContext, useEffect, useState } from 'react';
import styles from './Vaults.module.css';
import VaultRow from './VaultRow/VaultRow';
import { VaultIF } from '../../../ambient-utils/types';
import { allVaultsData } from './mockVaultData';
import { AppStateContext } from '../../../contexts';

function Vaults() {
    // !important:  once we have mock data, change the type on this
    // !important:  ... value to `VaultIF[]` and then fix linter
    // !important:  ... warnings which manifest in response

    const {
        activeNetwork: { chainId },
    } = useContext(AppStateContext);

    const vaultHeader = (
        <div className={styles.vaultHeader}>
            <span />
            <span className={styles.poolName}></span>
            <span className={styles.tvl}>TVL</span>
            <span className={styles.depositContainer}>My Deposit</span>
            <span className={styles.apyDisplay}>APY</span>
            <span className={styles.actionButtonContainer} />
        </div>
    );

    // vault data from tempest API
    const [vaultData, setVaultData] = useState(null);
    console.log(vaultData);
    false && vaultData;

    // logic to fetch vault data from API
    useEffect(() => {
        async function getData(): Promise<void> {
            const endpoint = 'https://protocol-service-api.tempestfinance.xyz/api/v1/vaults';
            const response = await fetch(endpoint);
            const { data } = await response.json();
            setVaultData(data.vaults);
        }
        vaultData ?? getData();
    }, []);

    return (
        <div data-testid={'vaults'} className={styles.container}>
            <div className={styles.content}>
                <header className={styles.vault_page_header}>
                    <h3>Vaults</h3>
                    <p>
                        Vaults built on top of Ambient liquidity pools for
                        simplified strategic liquidity management. Deployed and
                        managed by partner protocols like Tempest.
                    </p>
                </header>
                {vaultHeader}
                <div
                    className={`${styles.scrollableContainer} custom_scroll_ambient`}
                >
                    {allVaultsData
                        .filter(
                            (vault) =>
                                Number(vault.chainId) === Number(chainId),
                        )
                        .map((vault: VaultIF) => {
                            const KEY_SLUG = 'vault_row_';
                            return (
                                <VaultRow
                                    key={KEY_SLUG + JSON.stringify(vault)}
                                    idForDOM={KEY_SLUG + vault.toString()}
                                    vault={vault}
                                />
                            );
                        })}
                </div>
            </div>
        </div>
    );
}

export default memo(Vaults);
