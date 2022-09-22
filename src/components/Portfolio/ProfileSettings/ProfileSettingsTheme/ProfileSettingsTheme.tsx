import styles from './ProfileSettingsTheme.module.css';
import { useState } from 'react';
import { motion, Variants } from 'framer-motion';
import { BsCheckCircle } from 'react-icons/bs';
import { FiCircle } from 'react-icons/fi';

// const itemVariants: Variants = {
//     open: {
//         opacity: 1,
//         y: 0,
//         transition: { type: 'spring', stiffness: 300, damping: 24 },
//     },
//     closed: { opacity: 0, y: 20, transition: { duration: 0.2 } },
// };

const mainVariant: Variants = {
    open: {
        clipPath: 'inset(0% 0% 0% 0% round 4px)',
        transition: {
            type: 'spring',
            bounce: 0,
            duration: 0.7,
            delayChildren: 0.3,
            staggerChildren: 0.05,
        },
    },
    closed: {
        clipPath: 'inset(10% 50% 90% 50% round 4px)',
        transition: {
            type: 'spring',
            bounce: 0,
            duration: 0.3,
        },
    },
};

interface ProfileSettingItemPropsIF {
    isSelected: boolean;
    name: string;
    onClick: () => void;
}

const themeItems = [
    {
        name: 'default',
        color: '#ff0055',
    },
    {
        name: 'Light',
        color: 'White',
    },
    {
        name: 'Dark',
        color: '#22cc88',
    },
];
export default function ProfileSettingsTheme() {
    const [isOpen, setIsOpen] = useState(false);
    const [selected, setSelected] = useState(themeItems[0]);

    const dropdownMenuArrow = (
        <motion.div
            variants={{
                open: { rotate: 180 },
                closed: { rotate: 0 },
            }}
            transition={{ duration: 0.2 }}
            style={{ originY: 0.55 }}
        >
            <svg width='15' height='15' viewBox='0 0 20 20'>
                <path d='M0 7 L 20 7 L 10 16' />
            </svg>
        </motion.div>
    );

    function ThemeItem(props: ProfileSettingItemPropsIF) {
        const { isSelected, onClick, name } = props;

        return (
            <motion.li
                className={styles.theme_item_container}
                onClick={onClick}
                // variants={itemVariants}
            >
                {name}
                {isSelected ? (
                    <BsCheckCircle size={24} color='#CDC1FF' />
                ) : (
                    <FiCircle size={24} color='#CDC1FF' />
                )}
            </motion.li>
        );
    }

    return (
        <motion.div initial={false} animate={isOpen ? 'open' : 'closed'} className={styles.menu}>
            <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setIsOpen(!isOpen)}
                className={styles.main_button}
            >
                Menu
                {dropdownMenuArrow}
            </motion.button>

            <motion.ul
                variants={mainVariant}
                style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
                className={styles.main_container}
            >
                {themeItems.map((theme, idx) => (
                    <ThemeItem
                        name={theme.name}
                        key={idx}
                        isSelected={selected.color === theme.color}
                        onClick={() => setSelected(theme)}
                    />
                ))}
            </motion.ul>
        </motion.div>
    );
}
