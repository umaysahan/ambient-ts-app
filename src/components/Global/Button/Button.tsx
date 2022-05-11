import styles from './Toggle.module.css';

interface ButtonProps {
    disabled: boolean;
    title: string;

    action: React.MouseEventHandler<HTMLElement>;
}
export default function Toggle(props: ButtonProps) {
    const { disabled, action, title } = props;
    return (
        <button
            className={`${disabled ? styles.disabled_btn : styles.btn}`}
            onClick={action}
            disabled={disabled}
        >
            {title}
        </button>
    );
}
