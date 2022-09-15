import styles from './PageFooter.module.css';
import { FaDiscord, FaGithub } from 'react-icons/fa';
import { BsMedium } from 'react-icons/bs';
import { AiFillTwitterCircle } from 'react-icons/ai';
// import { useLocation} from 'react-router-dom'

interface IFooterProps {
    lastBlockNumber: number;
    userIsOnline: boolean;
}

const pageBlockSign = <div className={styles.page_block_sign} />;

export default function PageFooter(props: IFooterProps) {
    const { userIsOnline, lastBlockNumber } = props;
    return (
        <footer data-testid={'page-footer'} className={styles.footer}>
            {userIsOnline ? '' : 'Offline'}
            <a href='#'>
                <AiFillTwitterCircle size={15} />
                {/* <span>Twitter</span> */}
            </a>
            <a href='#'>
                <FaDiscord size={15} />
                {/* <span>Discord</span> */}
            </a>
            <a href='#'>
                <BsMedium size={15} />
                {/* <span>Medium</span> */}
            </a>
            <a href='#'>
                <FaGithub size={15} />
                {/* <span>Github</span> */}
            </a>
            <a href='#'>
                <span>Docs</span>
            </a>
            {/* {location.pathname !== '/' && ( */}

            <div className={styles.block_number_div}>
                {pageBlockSign}
                <span>{lastBlockNumber}</span>
            </div>
            {/* // )} */}
        </footer>
    );
}
