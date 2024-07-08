import {
    getFormattedNumber,
    getTimeRemainingAbbrev,
} from '../../../../ambient-utils/dataLayer';
import { scatterData, textColor } from './ScatterChart';

interface propsIF {
    hoveredDot: scatterData | undefined;
    selectedDot: scatterData | undefined;
}
export default function ScatterTooltip(props: propsIF) {
    const { hoveredDot, selectedDot } = props;
    const displayData = hoveredDot
        ? hoveredDot
        : selectedDot
          ? selectedDot
          : undefined;

    const formatTime = (time: number) => {
        return getTimeRemainingAbbrev(time);
    };

    const formatPrice = (price: number) => {
        return getFormattedNumber({
            value: price,
            minFracDigits: 0,
            maxFracDigits: 0,
            isUSD: true,
        });
    };

    return (
        <div
            style={{
                gridColumn: 3,
                gridRow: 1,
                width: '150px',
                marginLeft: '0px',
                fontFamily: 'Roboto Mono',
                color: textColor,
                fontSize: '12px',
            }}
        >
            <p style={{ textAlign: 'left', margin: '2px 0' }}>
                TICKER:{' '}
                <span style={{ float: 'right', marginLeft: '10px' }}>
                    {displayData ? displayData.name : '-'}
                </span>
            </p>
            <p style={{ textAlign: 'left', margin: '2px 0' }}>
                TIME REMAINING:{' '}
                <span style={{ float: 'right', marginLeft: '10px' }}>
                    {displayData ? formatTime(displayData.timeRemaining) : '-'}
                </span>
            </p>
            <p style={{ textAlign: 'left', margin: '2px 0' }}>
                MARKET CAP:{' '}
                <span style={{ float: 'right', marginLeft: '10px' }}>
                    {displayData ? formatPrice(displayData.price) : '-'}
                </span>
            </p>
        </div>
    );
}