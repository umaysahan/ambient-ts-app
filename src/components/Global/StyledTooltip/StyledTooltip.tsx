import { withStyles } from '@material-ui/core/styles';
import Tooltip from '@material-ui/core/Tooltip';

export const DefaultTooltip = withStyles({
    tooltip: {
        color: '#ffffff',
        backgroundColor: '#171d27',
        zIndex: 999,
    },
    arrow: {
        color: '#171d27',
        zIndex: 999,
    },
})(Tooltip);

export const TextOnlyTooltip = withStyles({
    tooltip: {
        color: 'black',
        backgroundColor: 'transparent',
        zIndex: 999,
    },
})(Tooltip);

//   https://stackoverflow.com/questions/36759985/how-to-style-mui-tooltip
