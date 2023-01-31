import styles from './SidebarRangePositions.module.css';
import SidebarRangePositionsCard from './SidebarRangePositionsCard';
import { PositionIF, TokenIF } from '../../../../utils/interfaces/exports';
import { SetStateAction, Dispatch } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface propsIF {
    isDenomBase: boolean;
    userPositions?: PositionIF[];
    selectedOutsideTab: number;
    setSelectedOutsideTab: Dispatch<SetStateAction<number>>;
    outsideControl: boolean;
    setOutsideControl: Dispatch<SetStateAction<boolean>>;
    tokenMap: Map<string, TokenIF>;

    currentPositionActive: string;
    setCurrentPositionActive: Dispatch<SetStateAction<string>>;

    isShowAllEnabled: boolean;
    setIsShowAllEnabled: Dispatch<SetStateAction<boolean>>;
    isUserLoggedIn: boolean | undefined;
    expandTradeTable: boolean;
    setExpandTradeTable: Dispatch<SetStateAction<boolean>>;
    setShowSidebar: Dispatch<SetStateAction<boolean>>;
}

export default function SidebarRangePositions(props: propsIF) {
    const location = useLocation();
    const navigate = useNavigate();

    const {
        tokenMap,
        isDenomBase,
        userPositions,
        currentPositionActive,
        setCurrentPositionActive,
        // expandTradeTable,
        isUserLoggedIn,

        setShowSidebar,
    } = props;

    const onTradeRoute = location.pathname.includes('trade');
    const onAccountRoute = location.pathname.includes('account');

    const tabToSwitchToBasedOnRoute = onTradeRoute ? 2 : onAccountRoute ? 2 : 2;

    function redirectBasedOnRoute() {
        // if (onTradeRoute || onAccountRoute) return;
        // navigate('/trade');

        if (onAccountRoute) return;
        navigate('/account');
    }

    const handleViewMoreClick = () => {
        redirectBasedOnRoute();
        props.setOutsideControl(true);
        props.setSelectedOutsideTab(tabToSwitchToBasedOnRoute);

        setShowSidebar(false);

        // props.setIsShowAllEnabled(false);
        // props.setExpandTradeTable(true);
    };

    const sidebarRangePositionCardProps = {
        tokenMap: tokenMap,
        selectedOutsideTab: props.selectedOutsideTab,
        setSelectedOutsideTab: props.setSelectedOutsideTab,
        outsideControl: props.outsideControl,
        setOutsideControl: props.setOutsideControl,
        currentPositionActive: currentPositionActive,
        setCurrentPositionActive: setCurrentPositionActive,
        isShowAllEnabled: props.isShowAllEnabled,
        setIsShowAllEnabled: props.setIsShowAllEnabled,
        isUserLoggedIn: isUserLoggedIn,
        tabToSwitchToBasedOnRoute: tabToSwitchToBasedOnRoute,
    };

    // TODO:   @Junior please refactor the header <div> as a <header> element

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>Pool</div>
                <div>Range</div>
                <div>Value</div>
            </div>
            <div className={styles.content}>
                {userPositions &&
                    userPositions.map((position, idx) => (
                        <SidebarRangePositionsCard
                            key={idx}
                            position={position}
                            isDenomBase={isDenomBase}
                            {...sidebarRangePositionCardProps}
                        />
                    ))}
            </div>
            {isUserLoggedIn && (
                <div className={styles.view_more} onClick={handleViewMoreClick}>
                    View More
                </div>
            )}
        </div>
    );
}
