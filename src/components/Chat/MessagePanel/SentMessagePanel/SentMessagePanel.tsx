import styles from './SentMessagePanel.module.css';
import { Message } from '../../Model/MessageModel';
import PositionBox from '../PositionBox/PositionBox';
import { useEffect, useState } from 'react';
import Blockies from 'react-blockies';
import { FiDelete } from 'react-icons/fi';
import useChatApi from '../../Service/ChatApi';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../../../utils/hooks/reduxToolkit';
import { setDataLoadingStatus } from '../../../../utils/state/graphDataSlice';

interface SentMessageProps {
    message: Message;
    ensName: string;
    isCurrentUser: boolean;
    currentUser: string | undefined;
    userImageData: string[];
    resolvedAddress: string | undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    connectedAccountActive: any;
    isUserLoggedIn: boolean;
    moderator: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    room: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    isMessageDeleted: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setIsMessageDeleted: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    previousMessage: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    nextMessage: any;
}

export default function SentMessagePanel(props: SentMessageProps) {
    const [hasSeparator, sethasSeparator] = useState(false);
    const [isPosition, setIsPosition] = useState(false);
    const [showAvatar, setShowAvatar] = useState<boolean>(true);
    const [showName, setShowName] = useState<boolean>(true);
    const [daySeparator, setdaySeparator] = useState('');

    useEffect(() => {
        const previousMessageDate = new Date(props.previousMessage?.createdAt);
        const currentMessageDate = new Date(props.message?.createdAt);
        const nextMessageDate = new Date(props.nextMessage?.createdAt);
        const currentPreviousDiffInMs = Math.abs(
            currentMessageDate.getTime() - previousMessageDate.getTime(),
        );
        const nextCurrentDiffInMs = Math.abs(
            nextMessageDate.getTime() - currentMessageDate.getTime(),
        );

        getDayAndName(
            props.previousMessage?.createdAt,
            props.message?.createdAt,
        );

        if (props.previousMessage?.sender === props.message?.sender) {
            if (currentPreviousDiffInMs < 10 * 60 * 1000) {
                setShowAvatar(false);
                setShowName(false);
                if (
                    nextCurrentDiffInMs < 10 * 60 * 1000 &&
                    props.nextMessage?.sender === props.message?.sender
                ) {
                    sethasSeparator(false);
                } else {
                    sethasSeparator(true);
                }
            } else {
                setShowAvatar(true);
                setShowName(true);
                sethasSeparator(true);
            }
        } else {
            setShowAvatar(true);
            setShowName(true);
            if (
                nextCurrentDiffInMs < 10 * 60 * 1000 &&
                props.nextMessage?.sender === props.message?.sender
            ) {
                sethasSeparator(false);
            } else {
                sethasSeparator(true);
            }
        }
    }, [props.message]);

    const { deleteMessage } = useChatApi();

    const formatAMPM = (str: string) => {
        const date = new Date(str);
        let hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'pm' : 'am';
        hours = hours % 12;
        hours = hours ? hours : 12;
        const _min = minutes.toString().padStart(2, '0');
        const strTime = hours + ':' + _min + ' ' + ampm;
        return strTime;
    };

    const getDayAndName = (previousDay: string, currentDay: string) => {
        const today = new Date();
        const previousMessageDate = new Date(previousDay);
        const currentMessageDate = new Date(currentDay);
        const todayDayNumber = today.getUTCDate();
        const todayMonthNumber = today.toLocaleString('default', {
            month: 'long',
        });
        const previousDayNumber = previousMessageDate.getUTCDate();
        const currentDayNumber = currentMessageDate.getUTCDate();
        const currentDayMonthNumber = currentMessageDate.toLocaleString(
            'default',
            {
                month: 'long',
            },
        );
        if (
            todayDayNumber === currentDayNumber &&
            todayMonthNumber === currentDayMonthNumber &&
            previousDayNumber !== currentDayNumber
        ) {
            setdaySeparator('Today');
        } else {
            if (previousDayNumber !== currentDayNumber) {
                setdaySeparator(currentDayNumber + ' ' + currentDayMonthNumber);
            } else {
                setdaySeparator('');
            }
        }
    };

    function getName() {
        if (
            props.message.ensName === 'defaultValue' ||
            props.message.ensName === null ||
            props.message.ensName === undefined
        ) {
            return props.message.walletID.slice(0, 6) + '...';
        } else {
            return props.message.ensName;
        }
    }

    function handleOpenExplorer(url: string) {
        window.open(url);
    }

    function isLink(url: string) {
        const urlPattern =
            /^(http|https):\/\/[a-z0-9]+([-.\w]*[a-z0-9])*\.([a-z]{2,5})(:[0-9]{1,5})?(\/.*)?$/i;
        if (url.includes(' ')) {
            const words: string[] = url.split(' ');
            return (
                <>
                    {words.map((word, index) => (
                        <span
                            onClick={() => handleOpenExplorer(word)}
                            key={index}
                            style={
                                urlPattern.test(word)
                                    ? { color: '#ab7de7' }
                                    : { color: 'white' }
                            }
                        >
                            {' ' + word}
                        </span>
                    ))}
                </>
            );
        } else {
            if (urlPattern.test(url)) {
                return (
                    <p
                        style={{ color: '#ab7de7' }}
                        onClick={() => handleOpenExplorer(url)}
                    >
                        {url}
                    </p>
                );
            } else {
                return url;
            }
        }
    }

    function mentionedMessage() {
        const messagesArray = props.message.message.split(' ');
        if (showAvatar === true) {
            if (props.message.isMentionMessage === true) {
                return (
                    <p>
                        {messagesArray.map((word, index) => (
                            <span
                                key={index}
                                className={` ${
                                    props.isUserLoggedIn
                                        ? word.slice(1) === props.ensName ||
                                          word.slice(1) ===
                                              props.connectedAccountActive
                                            ? styles.mention_message
                                            : styles.message
                                        : styles.message
                                }`}
                            >
                                {'' + isLink(word)}
                            </span>
                        ))}
                    </p>
                );
            } else {
                return (
                    <p className={styles.message}>
                        {isLink(props.message.message)}
                    </p>
                );
            }
        } else {
            if (props.message.isMentionMessage === true) {
                return (
                    <p>
                        {messagesArray.map((word, index) => (
                            <span
                                key={index}
                                className={` ${
                                    props.isUserLoggedIn
                                        ? word.slice(1) === props.ensName ||
                                          word.slice(1) ===
                                              props.connectedAccountActive
                                            ? styles.mention_message
                                            : styles.message
                                        : styles.message
                                }`}
                            >
                                {'' + isLink(word)}
                            </span>
                        ))}
                    </p>
                );
            } else {
                return (
                    <p className={styles.message_without_avatar}>
                        {isLink(props.message.message)}
                    </p>
                );
            }
        }
    }

    function deleteMessages(id: string) {
        // eslint-disable-next-line
        props.setIsMessageDeleted(false);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        deleteMessage(id).then((result: any) => {
            if (result.status === 'OK') {
                props.setIsMessageDeleted(true);
                return result;
            } else {
                props.setIsMessageDeleted(false);
            }
        });
    }
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const location = useLocation();

    const myBlockies = (
        <Blockies seed={props.message.walletID.toLowerCase()} scale={3} />
    );

    return (
        <div
            style={
                hasSeparator
                    ? { width: '90%', marginBottom: 4 }
                    : { width: '90%', marginBottom: -10 }
            }
        >
            <div>
                {daySeparator === '' ? (
                    ''
                ) : daySeparator !== '' ? (
                    <p className={styles.seperator}>{daySeparator}</p>
                ) : (
                    ''
                )}

                <div
                    className={
                        props.isUserLoggedIn
                            ? props.message.isMentionMessage === false
                                ? styles.sent_message_body
                                : props.message.mentionedName?.trim() ===
                                      props.ensName?.trim() ||
                                  props.message.mentionedName?.trim() ===
                                      props.connectedAccountActive?.trim()
                                ? styles.sent_message_body_with_mention
                                : styles.sent_message_body
                            : styles.sent_message_body
                    }
                >
                    {showAvatar && (
                        <div className={styles.nft_container}>{myBlockies}</div>
                    )}
                    <div className={styles.message_item}>
                        <div
                            className={
                                showName && props.isCurrentUser
                                    ? styles.current_user_name
                                    : showName && !props.isCurrentUser
                                    ? styles.name
                                    : !showName && !props.isCurrentUser
                                    ? ''
                                    : ''
                            }
                            onClick={() => {
                                if (
                                    location.pathname !==
                                    `/${
                                        props.message.ensName === 'defaultValue'
                                            ? props.message.walletID
                                            : props.message.ensName
                                    }`
                                ) {
                                    dispatch(
                                        setDataLoadingStatus({
                                            datasetName: 'lookupUserTxData',
                                            loadingStatus: true,
                                        }),
                                    );

                                    navigate(
                                        `/${
                                            props.message.ensName ===
                                            'defaultValue'
                                                ? props.message.walletID
                                                : props.message.ensName
                                        }`,
                                    );
                                }
                            }}
                        >
                            {showName && getName()}
                        </div>
                        <PositionBox
                            message={props.message.message}
                            isInput={false}
                            isPosition={isPosition}
                            setIsPosition={setIsPosition}
                        />
                        {!isPosition && mentionedMessage()}
                    </div>
                    {props.moderator ? (
                        <FiDelete
                            color='red'
                            onClick={() => deleteMessages(props.message._id)}
                        />
                    ) : (
                        ''
                    )}
                    <div>
                        <p className={styles.message_date}>
                            {formatAMPM(props.message.createdAt)}
                        </p>
                    </div>

                    {/* {snackbarContent} */}
                </div>
                {hasSeparator ? <hr /> : ''}
            </div>
        </div>
    );
}
