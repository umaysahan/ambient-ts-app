// START: Import React and Dongles
import { Dispatch, memo, SetStateAction, useContext } from 'react';
import { AiOutlineInfoCircle } from 'react-icons/ai';

import { AppStateContext } from '../../../contexts/AppStateContext';
import { TradeTableContext } from '../../../contexts/TradeTableContext';

// START: Import Local Files
import { handleRangeSlider } from './rangeWidthFunctions';
import RangeSlider from '../RangeSlider';
import { Chip } from '../Chip';
import { ExplanationButton } from '../Icons/Icons.styles';
import { FlexContainer } from '../../../styled/Common';
import truncateDecimals from '../../../utils/data/truncateDecimals';

// interface for React functional component props
interface propsIF {
    rangeWidthPercentage: number;
    setRangeWidthPercentage: Dispatch<SetStateAction<number>>;
    setRescaleRangeBoundariesWithSlider: Dispatch<SetStateAction<boolean>>;
}

// React functional component
function RangeWidth(props: propsIF) {
    const {
        rangeWidthPercentage,
        setRangeWidthPercentage,
        setRescaleRangeBoundariesWithSlider,
    } = props;
    const {
        globalPopup: { open: openGlobalPopup },
    } = useContext(AppStateContext);
    const { showRangePulseAnimation } = useContext(TradeTableContext);

    const balancedPresets: number[] = [5, 10, 25, 50, 100];
    type presetValues = typeof balancedPresets[number];

    // fn to update the width of range (balanced mode) from buttons
    function updateRangeWithButton(value: presetValues): void {
        // convert the numerical input to a string
        const valueString: string = value.toString();
        // locate the range adjustment slider in the DOM
        const inputSlider: HTMLElement | null =
            document.getElementById('input-slider-range');
        // set the range adjustment slider to the value provided in args
        if (inputSlider) {
            (inputSlider as HTMLInputElement).value = valueString;
        }
        // set the input value to two decimals of precision
        const truncatedValue: string = truncateDecimals(value, 2);
        // convert input value to a float and update range width
        setRangeWidthPercentage(parseFloat(truncatedValue));
    }

    const rangeWidthTooltip = (
        <ExplanationButton
            style={{ margin: '0 8px', cursor: 'pointer' }}
            onClick={() =>
                openGlobalPopup(
                    <div>
                        <p>
                            Percentage width of the range around current pool
                            price.
                        </p>
                        <p>
                            Tighter ranges accumulate rewards at faster rates,
                            but are more likely to suffer divergence losses.
                        </p>
                    </div>,
                    'Range Width',
                    'right',
                )
            }
        >
            <AiOutlineInfoCircle size={17} />
        </ExplanationButton>
    );

    return (
        <FlexContainer
            fullWidth
            transition
            flexDirection='column'
            gap={16}
            id='range_width'
            margin='0 0 16px 0'
        >
            <FlexContainer
                fullWidth
                wrap
                justifyContent='center'
                alignItems='center'
                gap={4}
            >
                {balancedPresets.map((preset: presetValues) => {
                    const humanReadable: string =
                        preset === 100 ? 'Ambient' : preset.toString() + '%';
                    return (
                        <Chip
                            key={humanReadable}
                            id={`range_width_preset_${humanReadable}`}
                            variant={
                                rangeWidthPercentage === preset
                                    ? 'filled'
                                    : 'secondary'
                            }
                            onClick={() => {
                                updateRangeWithButton(preset);
                                setRescaleRangeBoundariesWithSlider(true);
                            }}
                            aria-label={`Set range width to ${humanReadable}.`}
                        >
                            {humanReadable}
                        </Chip>
                    );
                })}
                <ExplanationButton
                    onClick={() =>
                        openGlobalPopup(
                            <div>
                                Ambient liquidity remains fully in range
                                regardless of pool price, but accumulates
                                rewards at lower rates.
                            </div>,
                            'Ambient Range Width',
                            'right',
                        )
                    }
                    aria-label='Open range width explanation popup.'
                >
                    <AiOutlineInfoCircle color='var(--text2)' />
                </ExplanationButton>
            </FlexContainer>
            <FlexContainer
                justifyContent='center'
                fontWeight='100'
                fontSize='header1'
                color='text1'
                animation={showRangePulseAnimation ? 'flicker' : ''}
                id='percentage-output'
                aria-live='polite'
                aria-atomic='true'
                aria-relevant='all'
            >
                {rangeWidthPercentage === 100
                    ? 'Ambient'
                    : '± ' + rangeWidthPercentage + '%'}
                {rangeWidthTooltip}
            </FlexContainer>
            <FlexContainer
                alignItems='center'
                padding='0 16px'
                height='40px'
                justifyContent='center'
            >
                <RangeSlider
                    percentageInput
                    defaultValue={rangeWidthPercentage}
                    id='input-slider-range'
                    onChange={(event) =>
                        handleRangeSlider(event, setRangeWidthPercentage)
                    }
                    onClick={() => {
                        setRescaleRangeBoundariesWithSlider(true);
                    }}
                />
            </FlexContainer>
        </FlexContainer>
    );
}

export default memo(RangeWidth);
