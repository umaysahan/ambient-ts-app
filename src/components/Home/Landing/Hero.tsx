// import logoText from '../../../assets/images/logos/logo_text.png';
import { FlexContainer, Text } from '../../../styled/Common';
// import blastLogo from '../../../assets/images/logos/blast_logo.svg';
// import scrollLogo from '../../../assets/images/logos/scroll_brand_logo.svg';
import TradeNowButton from './TradeNowButton/TradeNowButton';
import styles from './BackgroundImages.module.css';
import { HeroContainer } from '../../../styled/Components/Home';
import useMediaQuery from '../../../utils/hooks/useMediaQuery';
import { useContext, useMemo } from 'react';
// import { ChainDataContext } from '../../../contexts/ChainDataContext';
import { BrandContext } from '../../../contexts/BrandContext';
import { heroItem } from '../../../assets/branding/types';

export default function Hero() {
    const smallScreen = useMediaQuery('(max-width: 1200px)');
    // const { isActiveNetworkBlast, isActiveNetworkScroll } =
    //     useContext(ChainDataContext);
    const { hero, platformName } = useContext(BrandContext);

    type cssSlugs = 'purple_waves' | 'stars';
    const cssSlug = useMemo<cssSlugs>(() => {
        let slug: cssSlugs;
        switch (platformName) {
            case 'futa':
                slug = 'stars';
                break;
            case 'ambient':
            default:
                slug = 'purple_waves';
                break;
        }
        return slug;
    }, [platformName]);

    function makeHeroJSX(h: heroItem) {
        let jsxOutput: JSX.Element;
        if (h.processAs === 'text') {
            jsxOutput = (
                <p
                    className={styles.ambient_blast_logo}
                    style={{ fontSize: '110px' }}
                >
                    {h.content}
                </p>
            );
        } else if (h.processAs === 'image') {
            jsxOutput = (
                <img
                    src={h.content}
                    alt=''
                    width='70px'
                    style={{
                        marginTop: '8px',
                        maxWidth: '60%',
                    }}
                />
            );
        } else if (h.processAs === 'separator') {
            jsxOutput = (
                <Text
                    fontWeight='200'
                    // fontSize='800px'
                    color='text1'
                    align='center'
                    style={{
                        marginTop: '20px',
                        marginLeft: '15px',
                        marginRight: '15px',
                        fontSize: '30px',
                    }}
                >
                    {h.content}
                </Text>
            );
        } else {
            jsxOutput = <></>;
        }
        return jsxOutput;
    }

    return (
        <HeroContainer
            justifyContent='center'
            alignItems='center'
            rounded
            fullHeight
            fullWidth
            id='hero'
            className={styles[cssSlug]}
        >
            <FlexContainer
                flexDirection='column'
                alignItems='center'
                justifyContent='center'
                gap={32}
            >
                <FlexContainer
                    flexDirection={smallScreen ? 'column' : 'row'}
                    alignItems='center'
                    gap={8}
                    style={{ verticalAlign: 'middle' }}
                >
                    {hero.map((h: heroItem) => makeHeroJSX(h))}
                </FlexContainer>
                <TradeNowButton fieldId='trade_now_btn_in_hero' />
            </FlexContainer>
        </HeroContainer>
    );

    // if (platformName === 'futa') {
    //     return (
    //         <HeroContainer
    //             justifyContent='center'
    //             alignItems='center'
    //             rounded
    //             fullHeight
    //             fullWidth
    //             id='hero'
    //             className={styles['futa']}
    //         >
    //             <FlexContainer
    //                 flexDirection='column'
    //                 alignItems='center'
    //                 justifyContent='center'
    //                 gap={32}
    //             >
    //                 <FlexContainer
    //                     flexDirection={smallScreen ? 'column' : 'row'}
    //                     alignItems='center'
    //                     gap={8}
    //                     style={{ verticalAlign: 'middle' }}
    //                 >
    //                     {hero.map((h: heroItem) => makeHeroJSX(h))}
    //                 </FlexContainer>
    //                 <TradeNowButton fieldId='trade_now_btn_in_hero' />
    //             </FlexContainer>
    //         </HeroContainer>
    //     );
    // } else if (isActiveNetworkBlast) {
    //     return (
    //         <HeroContainer
    //             justifyContent='center'
    //             alignItems='center'
    //             rounded
    //             fullHeight
    //             fullWidth
    //             id='hero'
    //             className={styles['ambi']}
    //         >
    //             <FlexContainer
    //                 flexDirection='column'
    //                 alignItems='center'
    //                 justifyContent='center'
    //                 gap={32}
    //             >
    //                 <FlexContainer
    //                     flexDirection={smallScreen ? 'column' : 'row'}
    //                     alignItems='center'
    //                     gap={8}
    //                     style={{ verticalAlign: 'middle' }}
    //                 >
    //                     {platformName && (
    //                         <>
    //                             <p
    //                                 className={styles.ambient_blast_logo}
    //                                 style={{ fontSize: '90px' }}
    //                             >
    //                                 {platformName}
    //                             </p>
    //                             <Text
    //                                 fontWeight='100'
    //                                 color='text1'
    //                                 align='center'
    //                                 style={{
    //                                     marginTop: '20px',
    //                                     marginLeft: '15px',
    //                                     fontSize: '30px',
    //                                 }}
    //                             >
    //                                 X
    //                             </Text>
    //                         </>
    //                     )}
    //                     <img
    //                         src={blastLogo}
    //                         alt=''
    //                         width='130px'
    //                         style={{ marginTop: '8px', maxWidth: '60%' }}
    //                     />
    //                 </FlexContainer>
    //                 <TradeNowButton fieldId='trade_now_btn_in_hero' />
    //             </FlexContainer>
    //         </HeroContainer>
    //     );
    // } else if (isActiveNetworkScroll) {
    //     return (
    //         <HeroContainer
    //             justifyContent='center'
    //             alignItems='center'
    //             rounded
    //             fullHeight
    //             fullWidth
    //             id='hero'
    //             className={styles['ambi']}
    //         >
    //             <FlexContainer
    //                 flexDirection='column'
    //                 alignItems='center'
    //                 justifyContent='center'
    //                 gap={32}
    //             >
    //                 <FlexContainer
    //                     flexDirection={smallScreen ? 'column' : 'row'}
    //                     alignItems='center'
    //                     gap={8}
    //                     style={{ verticalAlign: 'middle' }}
    //                 >
    //                     {platformName && (
    //                         <>
    //                             <p
    //                                 className={styles.ambient_blast_logo}
    //                                 style={{ fontSize: '110px' }}
    //                             >
    //                                 {platformName}
    //                             </p>

    //                             <Text
    //                                 fontWeight='100'
    //                                 color='text1'
    //                                 align='center'
    //                                 style={{
    //                                     marginTop: '20px',
    //                                     marginLeft: '15px',
    //                                     marginRight: '15px',
    //                                     fontSize: '30px',
    //                                 }}
    //                             >
    //                                 X
    //                             </Text>
    //                         </>
    //                     )}
    //                     <img
    //                         src={scrollLogo}
    //                         alt=''
    //                         width='70px'
    //                         style={{
    //                             marginTop: '8px',
    //                             maxWidth: '60%',
    //                         }}
    //                     />
    //                 </FlexContainer>
    //                 <TradeNowButton fieldId='trade_now_btn_in_hero' />
    //             </FlexContainer>
    //         </HeroContainer>
    //     );
    // } else {
    //     return (
    //         <HeroContainer
    //             justifyContent='center'
    //             alignItems='center'
    //             rounded
    //             fullHeight
    //             fullWidth
    //             id='hero'
    //             className={styles['ambi']}
    //         >
    //             <FlexContainer
    //                 flexDirection='column'
    //                 alignItems='center'
    //                 justifyContent='center'
    //                 gap={32}
    //             >
    //                 <p
    //                     className={styles.ambient_blast_logo}
    //                     style={{ fontSize: '110px' }}
    //                 >
    //                     {platformName}
    //                 </p>
    //                 <TradeNowButton fieldId='trade_now_btn_in_hero' />
    //             </FlexContainer>
    //         </HeroContainer>
    //     );
    // }
}
