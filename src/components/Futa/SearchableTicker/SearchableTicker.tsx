import { IoIosArrowDown, IoIosArrowUp } from 'react-icons/io';
import TickerItem from './TickerItem';
import { MdClose } from 'react-icons/md';
import {
    Dispatch,
    SetStateAction,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { BiSearch } from 'react-icons/bi';
import styles from './SearchableTicker.module.css';
import useOnClickOutside from '../../../utils/hooks/useOnClickOutside';
import Divider from '../Divider/Divider';
import {
    AuctionDataIF,
    AuctionsContext,
} from '../../../contexts/AuctionsContext';
import AuctionLoader from '../AuctionLoader/AuctionLoader';
import {
    auctionSorts,
    sortedAuctionsIF,
} from '../../../pages/platformFuta/Auctions/useSortedAuctions';

interface propsIF {
    auctions: sortedAuctionsIF;
    title?: string;
    setIsFullLayoutActive?: Dispatch<SetStateAction<boolean>>;
    isAccount?: boolean;
    placeholderTicker?: boolean | undefined;
}

export default function SearchableTicker(props: propsIF) {
    const { auctions, title, setIsFullLayoutActive, placeholderTicker } = props;
    const [isSortDropdownOpen, setIsSortDropdownOpen] =
        useState<boolean>(false);
    const [showComplete, setShowComplete] = useState<boolean>(false);
    const customLoading = false;
    const { setIsLoading, selectedTicker, setSelectedTicker } =
        useContext(AuctionsContext);

    // DOM id for search input field
    const INPUT_DOM_ID = 'ticker_auction_search_input';

    // variable to hold user search input from the DOM
    const [searchInputRaw, setSearchInputRaw] = useState<string>('');

    // fn to clear search input and re-focus the input element
    function clearInput(): void {
        setSearchInputRaw('');
        focusInput();
    }

    function focusInput(): void {
        document.getElementById(INPUT_DOM_ID)?.focus();
    }

    const [incompleteAuctions, completeAuctions] = useMemo<
        [AuctionDataIF[], AuctionDataIF[]]
    >(() => {
        const complete: AuctionDataIF[] = [];
        const incomplete: AuctionDataIF[] = [];
        auctions.data.forEach((auction: AuctionDataIF) => {
            auction.createdAt >
            (Date.now() - auction.auctionLength * 1000) / 1000
                ? incomplete.push(auction)
                : complete.push(auction);
        });
        return [incomplete, complete];
    }, [auctions.data]);

    // auto switch to complete auctions if user only has complete auctions
    useEffect(() => {
        if (!incompleteAuctions.length && completeAuctions.length) {
            setShowComplete(true);
        }
    }, [incompleteAuctions.length, completeAuctions.length]);

    const filteredData = useMemo<AuctionDataIF[]>(() => {
        const dataFilteredByCompletion = showComplete
            ? completeAuctions
            : incompleteAuctions;
        const dataFilteredBySearch = dataFilteredByCompletion.filter(
            (auc: AuctionDataIF) =>
                auc.ticker.includes(searchInputRaw.toUpperCase()),
        );

        return dataFilteredBySearch;
    }, [searchInputRaw, incompleteAuctions, completeAuctions, showComplete]);

    const timeDropdownRef = useRef<HTMLDivElement>(null);

    const clickOutsideHandler = () => {
        setIsSortDropdownOpen(false);
    };
    useOnClickOutside(timeDropdownRef, clickOutsideHandler);

    const sortDropdownOptions = [
        { label: 'Time Remaining', value: 'Time Remaining', slug: 'timeLeft' },
        { label: 'Market Cap', value: 'Market Cap', slug: 'marketCap' },
    ];

    const [activeSortOption, setActiveSortOption] = useState(
        sortDropdownOptions[0],
    );

    useEffect(() => {
        if (placeholderTicker) setSelectedTicker(undefined);
    }, [placeholderTicker]);

    if (customLoading) return <AuctionLoader setIsLoading={setIsLoading} />;

    return (
        <div className={styles.container}>
            <Divider count={2} />
            <div className={styles.header}>
                {title && (
                    <h3
                        className={styles.title}
                        onClick={
                            setIsFullLayoutActive
                                ? () => setIsFullLayoutActive((prev) => !prev)
                                : () => null
                        }
                    >
                        {title}
                    </h3>
                )}
                <div className={styles.filter_options}>
                    <div className={styles.search_and_filter}>
                        <div className={styles.text_search_box}>
                            <BiSearch
                                size={20}
                                color='var(--text2)'
                                id='searchable_ticker_input'
                                onClick={() => focusInput()}
                            />
                            <input
                                type='text'
                                id={INPUT_DOM_ID}
                                value={searchInputRaw}
                                onChange={(e) =>
                                    setSearchInputRaw(e.target.value)
                                }
                                placeholder='SEARCH...'
                                spellCheck={false}
                                autoComplete='off'
                                tabIndex={1}
                            />
                            <MdClose
                                size={20}
                                color='var(--text2)'
                                onClick={() => clearInput()}
                            />
                        </div>
                        <div className={styles.filters} ref={timeDropdownRef}>
                            <div className={styles.timeDropdownContent}>
                                <div
                                    className={styles.timeDropdownButton}
                                    onClick={() =>
                                        setIsSortDropdownOpen(
                                            !isSortDropdownOpen,
                                        )
                                    }
                                >
                                    <p>{activeSortOption.label}</p>
                                    {isSortDropdownOpen ? (
                                        <IoIosArrowUp />
                                    ) : (
                                        <IoIosArrowDown color='var(--text1)' />
                                    )}
                                </div>

                                <div
                                    className={styles.sort_direction}
                                    onClick={() => auctions.reverse()}
                                >
                                    <IoIosArrowUp
                                        size={14}
                                        color={
                                            auctions.isReversed
                                                ? 'var(--accent1)'
                                                : ''
                                        }
                                        // color={
                                        //     activeSortOption.slug === 'timeLeft'
                                        //         ? auctions.isReversed
                                        //             ? ''
                                        //             : 'var(--accent1)'
                                        //         : auctions.isReversed
                                        //           ? 'var(--accent1)'
                                        //           : ''
                                        // }
                                    />

                                    <IoIosArrowDown
                                        size={14}
                                        color={
                                            !auctions.isReversed
                                                ? 'var(--accent1)'
                                                : ''
                                        }
                                        // color={
                                        //     activeSortOption.slug === 'timeLeft'
                                        //         ? !auctions.isReversed
                                        //             ? ''
                                        //             : 'var(--accent1)'
                                        //         : !auctions.isReversed
                                        //           ? 'var(--accent1)'
                                        //           : ''
                                        // }
                                    />
                                </div>
                            </div>

                            {isSortDropdownOpen && (
                                <div className={styles.dropdown}>
                                    {sortDropdownOptions.map((item, idx) => (
                                        <p
                                            className={styles.timeItem}
                                            key={idx}
                                            onClick={() => {
                                                setActiveSortOption(item);
                                                setIsSortDropdownOpen(false);
                                                auctions.update(
                                                    item.slug as auctionSorts,
                                                );
                                            }}
                                        >
                                            {item.label}
                                        </p>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className={styles.sort_toggles}>
                        <button
                            onClick={() => setShowComplete(!showComplete)}
                            className={
                                showComplete
                                    ? styles.buttonOn
                                    : styles.buttonOff
                            }
                        >
                            SHOW COMPLETE
                        </button>
                        <button className={styles.buttonOff}>WATCHLIST</button>
                    </div>
                </div>
            </div>
            <div className={styles.tickerTableContainer}>
                <header className={styles.tickerHeader}>
                    <p>TICKER</p>
                    <p className={styles.marketCapHeader}>MARKET CAP</p>
                    <p>REMAINING</p>
                    <div className={styles.statusContainer}>
                        {/* <span /> */}
                    </div>
                </header>
                <div className={styles.tickerTableContent}>
                    {filteredData.map((auction: AuctionDataIF) => (
                        <TickerItem
                            key={JSON.stringify(auction)}
                            auction={auction}
                            selectedTicker={selectedTicker}
                            setSelectedTicker={setSelectedTicker}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
