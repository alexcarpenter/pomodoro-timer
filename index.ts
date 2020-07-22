import { Machine, createMachine, interpret } from 'xstate';
import { formatTime } from './utils';

const timerMachine = createMachine(
  {
    id: 'timer',
    initial: 'idle',
    context: {
      duration: 1440,
      interval: 1000
    },
    states: {
      idle: {
        entry: ['resetTimer'],
        on: {
          TOGGLE: 'running'
        }
      },
      running: {
        activities: ['startTimer'],
        on: { TOGGLE: 'paused', RESET: 'idle' }
      },
      paused: {
        on: { TOGGLE: 'running', RESET: 'idle' }
      }
    }
  },
  {
    actions: {
      resetTimer: (context) => context.duration = 1440
    },
    activities: {
      startTimer: (context) => {
        context.duration = context.duration - 1
        const interval = setInterval(() => {
          context.duration = context.duration - 1
          document.getElementById('time').innerHTML = formatTime(context.duration);
        }, context.interval);
        return () => clearInterval(interval);
      }
    }
  }
);

const timeEl = document.getElementById('time');
const toggleEl = document.getElementById('toggle');

const timerService = interpret(timerMachine)
  .onTransition((state) => {
    timeEl.innerHTML = formatTime(state.context.duration);
    document.body.dataset.state = state.value.toString();
    if (state.changed) {
      document.body.dataset.state = state.value.toString();
      if (state.value === 'running') {
        toggleEl.innerHTML = 'Pause'
      } else if (state.value === 'paused') {
        toggleEl.innerHTML = 'Resume'
      } else if (state.value === 'idle') {
        toggleEl.innerHTML = 'Start'
      }
    }
  })
  .start();

document.addEventListener('click', (event: MouseEvent) => {
  if (event.target.matches('#toggle')) {
    timerService.send('TOGGLE');
  } else if (event.target.matches('#reset')) {
    timerService.send('RESET');
  }
});