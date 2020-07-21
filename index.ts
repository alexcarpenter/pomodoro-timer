import { createMachine, interpret, assign } from '@xstate/fsm';
import { formatTime } from './utils';

interface TimerContext {
  time: number;
}

const timerMachine = createMachine<TimerContext>({
  id: 'timer',
  initial: 'idle',
  context: {
    time: 1440
  },
  states: {
    idle: {
      on: {
        TOGGLE: {
          target: 'running',
        }
      }
    },
    running: {
      on: {
        TOGGLE: {
          target: 'paused'
        },
        RESET: {
          target: 'idle'
        }
      }
    },
    paused: {
      on: {
        TOGGLE: {
          target: 'running'
        },
        RESET: {
          target: 'idle'
        }
      }
    }
  }
});


const timerService = interpret(timerMachine).start();

const timeEl = document.getElementById('time');
const toggleEl = document.getElementById('toggle');

timerService.subscribe(state => {
  timeEl.innerHTML = formatTime(state.context.time);
  document.body.dataset.state = state.value;
  if (state.changed) {
    document.body.dataset.state = state.value;
    if (state.value === 'running') {
      toggleEl.innerHTML = 'Pause'
    }
    if (state.value === 'paused') {
      toggleEl.innerHTML = 'Start'
    }
  }
});

document.addEventListener('click', (event: MouseEvent) => {
  if (event.target.matches('#toggle')) {
    timerService.send('TOGGLE');
  } else if (event.target.matches('#reset')) {
    timerService.send('RESET');
  }
});