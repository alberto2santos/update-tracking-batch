import { useReducer } from 'react';

const initialState = {
  filePath: '',
  fileMeta: null,
  running: false,
  manualInput: '',
  manualList: [],
  logs: [],
  progress: { current: 0, total: 0, percent: 0 },
  stats: { success: 0, skipped: 0, errors: 0, avgTime: 0 },
  history: [],
  showHistory: false,
  showSettings: false,
  startTime: null,
  elapsedTime: 0,
  eta: null,
  forceStopConfirm: false
};

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_FILE':
      return { ...state, filePath: action.payload.path, fileMeta: action.payload.meta };
    
    case 'START_JOB':
      return { ...state, running: true, startTime: Date.now(), forceStopConfirm: false };
    
    case 'STOP_JOB':
      return { ...state, running: false, startTime: null, forceStopConfirm: false };
    
    case 'ADD_LOG':
      return { ...state, logs: [...state.logs.slice(-999), action.payload] };
    
    case 'UPDATE_PROGRESS':
      return { ...state, progress: action.payload };
    
    case 'UPDATE_STATS':
      return { ...state, stats: action.payload };
    
    case 'ADD_MANUAL_ORDER':
      return { ...state, manualList: [...state.manualList, action.payload], manualInput: '' };
    
    case 'REMOVE_MANUAL_ORDER':
      return { ...state, manualList: state.manualList.filter((_, i) => i !== action.payload) };
    
    case 'CLEAR_ALL':
      return { ...state, manualList: [], filePath: '', fileMeta: null };
    
    case 'CLEAR_LOGS':
      return { ...state, logs: [] };
    
    case 'SET_HISTORY':
      return { ...state, history: action.payload };
    
    case 'TOGGLE_HISTORY':
      return { ...state, showHistory: !state.showHistory };
    
    case 'TOGGLE_SETTINGS':
      return { ...state, showSettings: !state.showSettings };
    
    case 'UPDATE_ELAPSED_TIME':
      return { ...state, elapsedTime: action.payload };
    
    case 'UPDATE_ETA':
      return { ...state, eta: action.payload };
    
    case 'TOGGLE_FORCE_STOP':
      return { ...state, forceStopConfirm: !state.forceStopConfirm };
    
    default:
      return state;
  }
}

export function useAppState() {
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  return { state, dispatch };
}