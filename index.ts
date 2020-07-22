import { createMachine, interpret, assign } from 'xstate';
import { formatTime } from './utils';

interface PomodoroContext {
  duration: number;
  elapsed: number;
  interval: number;
}

type PomodoroEvent =
  | {
    type: 'TICK';
  }
  | {
    type: 'DURATION.UPDATE';
    value: number;
  }
  | {
    type: 'TOGGLE';
  }
  | {
    type: 'RESET';
  };


const pomodoroMachine = createMachine<PomodoroContext, PomodoroEvent>(
  {
    id: 'pomodoro',
    initial: 'idle',
    context: {
      duration: 1440,
      elapsed: 0,
      interval: 1
    },
    states: {
      idle: {
        on: {
          TOGGLE: 'running'
        }
      },
      running: {
        invoke: {
          src: context => cb => {
            cb('TICK');
            const interval = setInterval(() => {
              cb('TICK');
            }, 1000 * context.interval);

            return () => {
              clearInterval(interval);
            }
          }
        },
        on: {
          '': {
            target: 'idle',
            cond: context => {
              return context.elapsed >= context.duration
            },
            actions: assign({
              elapsed: 0
            })
          },
          TOGGLE: 'paused',
          TICK: {
            actions: assign({
              elapsed: context => +(context.elapsed + context.interval).toFixed(2)
            })
          }
        }
      },
      paused: {
        on: {
          TOGGLE: 'running'
        }
      },
      completed: {
        type: 'final'
      }
    },
    on: {
      'DURATION.UPDATE': {
        target: 'idle',
        actions: assign({
          duration: (_, event) => event.value,
          elapsed: 0
        })
      },
      RESET: {
        target: 'idle',
        actions: assign<PomodoroContext>({
          elapsed: 0
        })
      }
    }
  }
);

const timeEl = document.getElementById('time');
const toggleEl = document.getElementById('toggle');

const pomodoroService = interpret(pomodoroMachine)
  .onTransition((state) => {
    document.body.dataset.state = state.value.toString();
    timeEl.innerHTML = formatTime(state.context.duration - state.context.elapsed)
    if (state.changed) {
      document.body.dataset.state = state.value.toString();
      if (state.value === 'running') {
        document.title = `Running: ${formatTime(state.context.duration - state.context.elapsed)}`;
        toggleEl.innerHTML = 'Pause'
      } else if (state.value === 'paused') {
        document.title = `Paused: ${formatTime(state.context.duration - state.context.elapsed)}`;
        toggleEl.innerHTML = 'Resume'
      } else if (state.value === 'idle' || state.value === 'completed') {
        document.title = 'Start a timer';
        toggleEl.innerHTML = 'Start'
      }
    }
  })
  .start();

document.querySelectorAll("input[name='duration']").forEach((input) => {
  input.addEventListener('change', event => {
    pomodoroService.send("DURATION.UPDATE", { value: +event.target.value });
  });
});

document.addEventListener('click', event => {
  if (event.target.matches('#toggle')) {
    pomodoroService.send('TOGGLE');
  } else if (event.target.matches('#reset')) {
    pomodoroService.send('RESET');
  }
});