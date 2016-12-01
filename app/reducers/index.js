import { LOG_IN, GET_USER_DATA, LOAD_AUDIOS, CHANGE_AUDIO } from '../constants';

const initialState = {
  user: {},
  isAuth: false,
  audioList: [],
  listType: ``,
  currentAudio: {},
};

export default function page(state = initialState, action) {
  switch (action.type) {
    case LOG_IN:
      return { ...state, isAuth: action.payload }
    case GET_USER_DATA:
      return { ...state, user: action.payload }
    case LOAD_AUDIOS:
      return { ...state, audioList: action.payload }
    case CHANGE_AUDIO:
      return { ...state, currentAudio: action.payload }
    default:
      return state;
} }
