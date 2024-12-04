import { trigger, state, style, transition, animate } from '@angular/animations';

export const collapseExpandAnimation = trigger('collapseExpand', [
    state(
        'collapsed',
        style({
            height: '67.6px',
            overflow: 'hidden',
        }),
    ),
    state(
        'expanded',
        style({
            height: '*',
        }),
    ),
    transition('collapsed <=> expanded', [animate('300ms ease-in-out')]),
]);
